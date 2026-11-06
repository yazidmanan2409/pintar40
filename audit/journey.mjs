// PART B — Gladys's real path, from an empty database in production posture.
//
// The stack starts with migrations only (no seed), exactly like production:
// one SYSTEM_ADMIN bootstrapped, environment 'production', and two REAL
// schools with one 2026/2027 period each. Every step records PASS / FAIL /
// BLOCKED with what the screen or the server actually said, and a screenshot.
// Where the product has no screen for a step, the step says so and the
// operator does it in SQL (marked OPERATOR), so the journey can go on and the
// next screen can still be tested.
//
// Runs on a GitHub runner against a local Supabase stack. Never production.

import { chromium, firefox, webkit } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { jalankanC12 } from "./c12.mjs";

const APP = process.env.APP_URL;
const SB = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB = process.env.SUPABASE_DB_URL;
const MAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const OUT = process.env.OUT_DIR ?? "audit-out/journey";
const SLOW = 30000;
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const require = createRequire(join(process.env.APP_DIR, "package.json"));
const { createClient } = require("@supabase/supabase-js");
mkdirSync(OUT, { recursive: true });

const admin = createClient(SB, SVC, { auth: { persistSession: false, autoRefreshToken: false } });
const steps = [];
let shotN = 0;

function sql(q) {
  return execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
}
async function shot(page, name) {
  const f = `${String(++shotN).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => {});
  return f;
}
async function step(id, title, fn) {
  const rec = { id, title, verdict: "PASS", observed: null, shots: [] };
  try {
    const r = await fn(rec);
    if (r !== undefined) rec.observed = r;
  } catch (e) {
    rec.verdict = rec.verdict === "PASS" ? "FAIL" : rec.verdict;
    rec.observed = (rec.observed ? rec.observed + " | " : "") + String(e.message ?? e).slice(0, 600);
  }
  steps.push(rec);
  console.log(`${rec.verdict.padEnd(8)} ${id.padEnd(5)} ${title} :: ${String(rec.observed ?? "").slice(0, rec.verdict === "PASS" ? 300 : 2000)}`);
  return rec;
}
const bodyText = async (page) => ((await page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ");

async function latestLink(email, after) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const j = await r.json().catch(() => ({}));
    const msgs = (j.messages ?? []).filter((m) => new Date(m.Created) > after);
    if (msgs.length) {
      const m = await (await fetch(`${MAIL}/api/v1/message/${msgs[0].ID}`)).json();
      const text = `${m.HTML ?? ""} ${m.Text ?? ""}`.replace(/&amp;/g, "&");
      const link = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/.exec(text)?.[0];
      return { link, subject: m.Subject, count: msgs.length };
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return { link: null, subject: null, count: 0 };
}
async function mailCount(email) {
  const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  return ((await r.json().catch(() => ({}))).messages ?? []).length;
}

// The activation code in the newest PINTAR email to this address after `after` (BOB-26: «482 913», grouped).
async function latestCode(email, after) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const j = await r.json().catch(() => ({}));
    const msgs = (j.messages ?? []).filter((m) => new Date(m.Created) > after);
    if (msgs.length) {
      const m = await (await fetch(`${MAIL}/api/v1/message/${msgs[0].ID}`)).json();
      const kode = /class="pin-kode"[^>]*>([\d\s]+)</.exec(m.HTML ?? "")?.[1]?.replace(/\s+/g, "") ?? null;
      return { kode, subject: m.Subject };
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return { kode: null, subject: null };
}

// SIGNING A PERSON IN, AS GATE 3 HAS IT (BOB-26, BOB-27; the email link's switch is off). The first time, a person
// activates their account: «Aktifkan akun» asks for the address, PINTAR emails a code (read from this local stack's
// sink), and the wizard below sets the name, a username, a PIN and a password. Afterwards they sign in on /masuk with
// their address and that password. The name is kept for the walk's existing calls.
const sudahAktif = new Set();
const lokalDari = (email) => email.split("@")[0].replace(/[^a-z0-9._]/g, "").slice(0, 16);
// a username the rules accept for every walk person: «admin.sd» is reserved (it begins with «admin.»), so all take a prefix
const usernameDari = (email) => `jalan_${lokalDari(email)}`.slice(0, 20).replace(/[._]+$/, "");
const sandiDari = (email) => `Audit-Jalan-${lokalDari(email)}-2026!Qz`;
async function magicSignIn(page, email) {
  if (!sudahAktif.has(email)) {
    const t0 = new Date(Date.now() - 1000);
    await page.goto(`${APP}/aktifkan`, { waitUntil: "networkidle" });
    await page.locator("#email").fill(email);
    await page.getByRole("button", { name: "Kirim kode" }).click();
    await page.locator("#kode").waitFor({ timeout: 20000 });
    const { kode, subject } = await latestCode(email, t0);
    if (!kode) throw new Error("no activation code arrived");
    await page.locator("#kode").fill(kode);
    await page.getByRole("button", { name: "Lanjut", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const lewat = await selesaikanMasuk(page, email);
    sudahAktif.add(email);
    return { landed: new URL(page.url()).pathname, subject, lewat };
  }
  await page.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await page.locator("#identitas").fill(email);
  await page.locator("#password").fill(sandiDari(email));
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const lewat = await selesaikanMasuk(page, email);
  return { landed: new URL(page.url()).pathname, subject: null, lewat };
}

// Gate 3 (BOB-26, DAISY-20) and Gate 6 (BOB-29): a person's first sign-in is held in the activation wizard until
// their set-up is done, and a staff browser is then asked «Komputer siapa ini?». Both are answered here by their own
// screens, as the person would: the name confirmed, a username, a PIN and a password; and «Komputer pribadi saya»,
// so that the walk's long-lived staff browsers are not locked by the shared-computer rule between its steps (that
// rule is walked by BOB29-A01..A03). The username, PIN and password are this local stack's synthetic values.
async function selesaikanMasuk(page, email) {
  const lewat = [];
  for (let putaran = 0; putaran < 12; putaran++) {
    const jalur = new URL(page.url()).pathname;
    if (jalur === "/aktifkan") {
      await page.locator("h1").first().waitFor({ timeout: 20000 });
      await page.waitForLoadState("networkidle");
      if (await page.getByRole("link", { name: "Masuk ke PINTAR" }).count()) {
        lewat.push("selesai");
        await page.getByRole("link", { name: "Masuk ke PINTAR" }).click();
        await page.waitForURL((u) => u.pathname !== "/aktifkan", { timeout: 20000 }).catch(() => {});
        await page.waitForLoadState("networkidle");
        continue;
      }
      if (await page.locator("#username").count()) {
        lewat.push("username");
        await page.locator("#username").fill(usernameDari(email));
        await page.getByRole("button", { name: "Simpan username" }).click();
      } else if (await page.locator("#pin").count()) {
        lewat.push("pin");
        await page.locator("#pin").fill("2817");
        await page.locator("#pin-ulang").fill("2817");
        await page.getByRole("button", { name: "Simpan PIN" }).click();
      } else if (await page.locator("#password").count()) {
        lewat.push("password");
        const sandi = sandiDari(email);
        await page.locator("#password").fill(sandi);
        await page.locator("#ulang").fill(sandi);
        await page.getByRole("button", { name: "Simpan password" }).click();
      } else if (await page.getByRole("button", { name: "Sudah benar" }).count()) {
        lewat.push("nama");
        await page.getByRole("button", { name: "Sudah benar" }).click();
      } else {
        throw new Error(`the activation wizard shows nothing the walk can answer: ${(await bodyText(page)).slice(0, 200)}`);
      }
      await page.waitForTimeout(1500);
      await page.waitForLoadState("networkidle");
      // a step the wizard refused says so in its alert; the walk stops there rather than pressing again
      const tolak = page.locator('.pin-msg-err[role="alert"]');
      if (await tolak.count()) throw new Error(`the activation wizard refused the ${lewat.at(-1)} step: ${norm(await tolak.first().innerText())}`);
      continue;
    }
    if (jalur === "/perangkat") {
      lewat.push("perangkat");
      await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
      await page.getByRole("button", { name: "Simpan pilihan" }).click();
      await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 20000 }).catch(() => {});
      await page.waitForLoadState("networkidle");
      continue;
    }
    break;
  }
  return lewat;
}
// a separate API session for the same person, for the steps whose screen is a server action
async function apiSession(email) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const c = createClient(SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const v = await c.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: "magiclink" });
  if (v.error) throw v.error;
  return c;
}
// D-084 J1.4: the platform admin makes a school's first person by the screen, «Orang baru di luar pendataan» on
// Aktivasi: types the name and the address, presses «Buat dan aktifkan», and reads what the screen answers
async function newPerson(page, name, email) {
  // L3 (D-132 C7): making a person outside intake is «Seluruh platform»'s, chosen on the chooser first
  await keKonteks(page, { tujuan: "MENGELOLA", platform: true });
  await page.goto(`${APP}/aktivasi?muat=${Date.now()}`, { waitUntil: "networkidle" });
  const baru = page.locator("section.pin-akt-baru");
  await baru.getByRole("heading", { name: "Orang baru di luar pendataan" }).waitFor({ timeout: 15000 });
  await baru.getByLabel("Nama").fill(name);
  await baru.locator('input[type="email"]').fill(email);
  await baru.getByRole("button", { name: "Buat dan aktifkan" }).click();
  // DAISY-20 (D-077): the first press shows what will be made; «Sudah benar, buat dan aktifkan» makes it
  const yakin = baru.getByRole("button", { name: "Sudah benar, buat dan aktifkan" });
  await yakin.waitFor({ timeout: 15000 }).catch(() => {});
  if (await yakin.count()) await yakin.click();
  const jawab = baru.locator('[role="status"], [role="alert"]').first();  // v3: a failed result line is an alert (D-138 step 2)
  await jawab.waitFor({ timeout: 20000 });
  const teks = norm(await jawab.innerText());
  const ok = /pin-hasil-ok/.test((await jawab.getAttribute("class")) ?? "") && teks.includes(name) && teks.includes(email);
  return { ok, teks };
}
async function grantViaForm(page, personName, roleValue, scopeLabelPart, until = "2027-06-30") {
  // a real load every time: a hash-only change on the same path keeps a stale person list
  await page.goto(`${APP}/konfigurasi/roles?muat=${Date.now()}#roles`, { waitUntil: "networkidle" });
  // BOB19-K01 (the owner's ruling of 8 Oct, Option B): the ordinary roles form is the one with a role picker; a school
  // with no administrator also draws «Menunjuk admin sekolah pertama», whose form has a person picker of its own
  const form = page.locator("form").filter({ has: page.locator('select[name="role"]') }).filter({ has: page.locator('select[name="person"]') });
  const personOpt = await form.locator('select[name="person"] option').filter({ hasText: personName }).first().getAttribute("value");
  if (!personOpt) throw new Error(`"${personName}" is not offered in the Orang list`);
  await form.locator('select[name="person"]').selectOption(personOpt);
  await form.locator('select[name="role"]').selectOption(roleValue);
  const scopes = await form.locator('select[name="scope"] option').allTextContents();
  const scopeOpt = await form.locator('select[name="scope"] option').filter({ hasText: scopeLabelPart }).first().getAttribute("value");
  if (!scopeOpt) throw new Error(`no scope option containing "${scopeLabelPart}"; offered: ${scopes.join(" / ")}`);
  await form.locator('select[name="scope"]').selectOption(scopeOpt);
  await form.locator('input[name="valid_until"]').fill(until);
  await form.getByRole("button", { name: "Berikan peran" }).click();
  await page.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const u = new URL(page.url());
  return { ok: u.searchParams.get("hasil"), detail: u.searchParams.get("detail"), url: u.pathname + u.search, scopesOffered: scopes.length };
}
// BOB19-K01 (the owner's ruling of 8 Oct, Option B): a school's first administrator is appointed by Admin platform, in
// Mengelola · that school while it has no Admin sekolah, by «Menunjuk admin sekolah pertama»: a person recorded at no
// school, a date, «Berikan peran»; the screen asks «Jadikan orang ini admin sekolah pertama di sekolah ini?» and
// «Ya, jadikan admin sekolah» appoints Admin sekolah at the school's root. Same return shape as grantViaForm.
async function adminPertamaViaForm(page, personName, until = "2027-06-30") {
  await page.goto(`${APP}/konfigurasi/roles?muat=${Date.now()}#roles`, { waitUntil: "networkidle" });
  const bagian = page.locator("[data-admin-pertama]");
  if (!(await bagian.count())) throw new Error("«Menunjuk admin sekolah pertama» is not offered");
  const form = bagian.locator("form");
  const pilihan = form.locator('select[name="person"] option').filter({ hasText: personName });
  if (!(await pilihan.count())) throw new Error(`"${personName}" is not offered for the first appointment`);
  await form.locator('select[name="person"]').selectOption(await pilihan.first().getAttribute("value"));
  await form.locator('input[name="valid_until"]').fill(until);
  await form.getByRole("button", { name: "Berikan peran" }).click();
  await page.waitForURL(/pertama=/, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const ditanya = norm(await bagian.innerText().catch(() => "")).includes("Jadikan orang ini admin sekolah pertama di sekolah ini?");
  const ya = bagian.getByRole("button", { name: "Ya, jadikan admin sekolah" });
  if (!(await ya.count())) throw new Error(`the first press did not ask for confirmation: ${page.url()}`);
  await ya.click();
  await page.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const u = new URL(page.url());
  return { ok: u.searchParams.get("hasil"), detail: u.searchParams.get("detail"), url: u.pathname + u.search, ditanya };
}
// BOB19-K01 (Option B): SMA's first administrator, made by Gladys with «Orang baru di luar pendataan» and appointed by
// «Menunjuk admin sekolah pertama» in Mengelola · SMA. Once: C12c needs it first (a school with no role at all is
// offered nowhere on Pendataan, so its staff cannot be recorded before it has an administrator), L3A reuses it.
const SMA_ADMIN = { name: "Bu Admin SMA", email: "admin.sma@audit.pintar.test" };
let adminSma = null;
async function pastikanAdminSma() {
  if (adminSma && adminSma.angkat.ok === "ok") return { ...adminSma, sudah: true };
  const np = await newPerson(g, SMA_ADMIN.name, SMA_ADMIN.email);
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SMA Zayd" });
  const angkat = np.ok ? await adminPertamaViaForm(g, SMA_ADMIN.name) : { ok: "no person" };
  adminSma = { np, angkat };
  return { ...adminSma, sudah: false };
}
// BOB19-K01 (Option B): staff a school does not have yet are recorded with the school's own tool and activated, then
// appointed from the school's own list (the path C12b's stafBaru walks). In the page's current context: Pendataan
// (no Tempat, no role), then Aktivasi «Aktifkan dengan email» on the person's row.
async function catatDanAktifkan(page, orang, shots) {
  const jejak = [await catatLewatLayar(page, [orang.name], shots, { kelas: null, peran: null })];
  await page.goto(`${APP}/aktivasi?muat=${Date.now()}`, { waitUntil: "networkidle" });
  const baris = page.locator("li.pin-akt-orang", { hasText: orang.name }).first();
  if (!(await baris.count())) throw new Error(`${orang.name} is not on Aktivasi`);
  await baris.locator('input[type="email"]').fill(orang.email);
  await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
  await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  jejak.push("Aktivasi «Aktifkan dengan email»");
  return jejak.join("; ");
}
// L3 (D-132 C3): the chooser (`/`) is the one place a working context changes, and visiting it changes nothing. A person
// picks a door, a purpose and a place as the screen names them: { tujuan, nama } or «Seluruh platform» ({ tujuan,
// platform: true }). On a chooser the app has already sent the person to (with a page to continue to), that one is used.
// Returns where the choice landed.
async function keKonteks(page, { tujuan, nama = null, platform = false }) {
  const diPemilih = new URL(page.url()).pathname === "/" && (await page.locator('[data-pemilih="konteks"]').count()) > 0;
  if (!diPemilih) await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  await pintu.first().waitFor({ timeout: SLOW });
  const semua = await pintu.evaluateAll((bs) => bs.map((b) => ({ k: b.getAttribute("data-konteks"), t: b.innerText })));
  const cocok = semua.filter((x) => (platform ? x.k === `${tujuan}:PLATFORM`
    : x.k.split(":")[0] === tujuan && x.k !== `${tujuan}:PLATFORM` && (!nama || x.t.includes(nama))));
  if (cocok.length !== 1) {
    throw new Error(`the chooser offers ${cocok.length} door(s) for ${tujuan}${platform ? " · Seluruh platform" : nama ? ` · ${nama}` : ""}: `
      + semua.map((x) => `${x.k} «${norm(x.t)}»`).join(" / "));
  }
  await page.locator(`[data-pemilih="konteks"] button[data-konteks="${cocok[0].k}"]`).click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}
async function hasSignOut(page) {
  return (await page.locator('form[action="/keluar"], a[href="/keluar"], button:has-text("Keluar")').count()) > 0;
}

// ───────────────────────────── world: production posture from an empty database
const GLADYS = "gladys@audit.pintar.test";
const people = {
  sdAdmin: { name: "Bu Admin SD", email: "admin.sd@audit.pintar.test" },
  guru: { name: "Pak Guru Budi", email: "guru.budi@audit.pintar.test" },
  guru2: { name: "Bu Guru Sari", email: "guru.sari@audit.pintar.test" },
  kaprodi: { name: "Bu Kepala Dept", email: "kepala.dept@audit.pintar.test" },
  dekan: { name: "Pak Dekan Hadi", email: "dekan.hadi@audit.pintar.test" },
};
const ids = {};

await step("W0", "operator: first administrator, production environment, two real schools", async () => {
  const { error } = await admin.auth.admin.createUser({ email: GLADYS, email_confirm: true, user_metadata: { display_name: "Gladys" } });
  if (error) throw error;
  const boot = await admin.rpc("bootstrap_first_system_admin", { p_email: GLADYS });
  if (boot.error) throw boot.error;
  sql(`update public.platform_environment set environment='production', local_fixtures_enabled=false`);
  for (const [slug, name] of [["sd-zps", "SD Zayd Pintar Selalu"], ["sma-zps", "SMA Zayd Pintar Selalu"]]) {
    sql(`with s as (insert into public.institutions (name, slug, is_synthetic) values ('${name}', '${slug}', false) returning id)
         insert into public.academic_periods (institution_id, name, starts_on, ends_on) select id, '2026/2027', '2026-07-13', '2027-06-30' from s`);
  }
  ids.sd = sql(`select id from public.institutions where slug='sd-zps'`);
  ids.sma = sql(`select id from public.institutions where slug='sma-zps'`);
  ids.period = sql(`select id from public.academic_periods where institution_id='${ids.sd}'`);
  return `environment=${sql("select environment from public.platform_environment")}; schools=${sql("select string_agg(slug||':'||is_synthetic,',') from public.institutions order by 1")}`;
});

const browser = await chromium.launch();
const ctx = () => browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
const gladysCtx = await ctx();
const g = await gladysCtx.newPage();

// BOB-38 (post-login review finding #1): a successful exchange must never show S14,
// «Tautan ini sudah tidak berlaku», not even for the moment before the page moves on.
// The observer is installed only on /auth/ pages, so it costs nothing later in the walk.
const s14Terlihat = [];
await g.exposeFunction("__s14", (path) => s14Terlihat.push(path));
await g.addInitScript(() => {
  if (!location.pathname.startsWith("/auth/")) return;
  let lapor = false;
  const periksa = () => {
    if (lapor || !/Tautan ini sudah tidak berlaku/.test(document.body?.innerText ?? "")) return;
    lapor = true;
    window.__s14?.(location.pathname);
  };
  new MutationObserver(periksa).observe(document, { subtree: true, childList: true, characterData: true });
  document.addEventListener("DOMContentLoaded", periksa);
});

await step("S1", "Gladys activates her account by the emailed code and the wizard, and lands on her home (Gate 3, BOB-26)", async (rec) => {
  const r = await magicSignIn(g, GLADYS);
  rec.shots.push(await shot(g, "gladys-after-signin"));
  if (!["/konfigurasi", "/"].includes(r.landed)) rec.verdict = "FAIL";
  if (s14Terlihat.length) rec.verdict = "FAIL";
  return `landed on ${r.landed} after ${r.lewat.join(" → ")}; email subject "${r.subject}"; S14 shown on the way: ${s14Terlihat.length ? `yes, at ${s14Terlihat.join(", ")}` : "no"}`;
});

// Gate 3 retired the sign-in link this step used to open in a second browser (BOB-27: the link's switch is off). Its
// question now: the same person, in a different browser, signs in with their address and password.
await step("S1b", "Gladys signs in again in a different browser, with her address and password", async (rec) => {
  const other = await ctx();
  const p = await other.newPage();
  try {
    const r = await magicSignIn(p, GLADYS);
    rec.shots.push(await shot(p, "gladys-other-browser"));
    if (!["/konfigurasi", "/"].includes(r.landed)) rec.verdict = "FAIL";
    return `landed on ${r.landed}${r.lewat.length ? ` after ${r.lewat.join(" → ")}` : ""}`;
  } finally {
    await other.close();
  }
});

await step("S2", "Gladys finds her way to account activation from Konfigurasi, and reads the platform's state there: its environment and, on «Jalankan pemeriksaan», its health (J1.3, SYS-01, SYS-02)", async (rec) => {
  // RESTATED FOR L3 (D-132 C7): the platform's state is «Seluruh platform»'s, which Gladys chooses on the chooser where
  // she landed; Studio is a school's or the library's, so this context links no Studio
  await keKonteks(g, { tujuan: "MENGELOLA", platform: true });
  await g.goto(`${APP}/konfigurasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "konfigurasi-gladys"));
  const links = await g.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  const toAktivasi = links.some((h) => h?.startsWith("/aktivasi"));
  const toStudio = links.some((h) => h?.startsWith("/studio"));
  // J1.3 (SYS-01, SYS-02): the platform's state where the platform admin lands: the environment, and the system's
  // health by pressing «Jalankan pemeriksaan» (the check runs only when asked); a fully migrated database passes
  const teks = norm(await g.locator("main").innerText().catch(() => ""));
  const lingkungan = /Lingkungan\s+production/i.test(teks);
  let sehat = "no «Jalankan pemeriksaan»";
  const periksa = g.getByRole("link", { name: "Jalankan pemeriksaan", exact: true });
  if (await periksa.count()) {
    await periksa.first().click();
    await g.waitForURL((u) => u.searchParams.get("periksa") === "skema", { timeout: SLOW });
    await g.waitForLoadState("networkidle");
    sehat = norm(await g.locator(".pin-sehat").first().innerText().catch(() => ""));
    rec.shots.push(await shot(g, "j1-3-kesehatan"));
  }
  const lolos = /Semua pemeriksaan lolos/.test(sehat);
  if (!toAktivasi || toStudio || !lingkungan || !lolos) rec.verdict = "FAIL";
  return `in «Seluruh platform»: link to /aktivasi: ${toAktivasi}; link to /studio: ${toStudio} (a school's or the library's); sign-out control: ${await hasSignOut(g)}; ` +
    `J1.3: environment production shown ${lingkungan}; health after «Jalankan pemeriksaan»: "${sehat}"`;
});

await step("S3", "Gladys creates the school admin on Aktivasi by the screen: «Orang baru di luar pendataan», name and address, «Buat dan aktifkan» (J1.4, ADM-01)", async (rec) => {
  await g.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "aktivasi-gladys"));
  const before = await mailCount(people.sdAdmin.email);
  const r = await newPerson(g, people.sdAdmin.name, people.sdAdmin.email);
  rec.shots.push(await shot(g, "aktivasi-orang-baru"));
  const after = await mailCount(people.sdAdmin.email);
  // the screen says what happens next: no email now; the person types the address on /masuk, and the role is given on Konfigurasi
  // Gate 3 (BOB-26): the person activates on /aktifkan by the address, once the role is given
  const arahan = /tidak mengirim (surel|email)/.test(r.teks) && /Konfigurasi/.test(r.teks) && /aktifkan/.test(r.teks);
  if (!r.ok || !arahan) rec.verdict = "FAIL";
  return `pressed «Buat dan aktifkan» on «Orang baru di luar pendataan»; the screen answered "${r.teks.slice(0, 300)}"; ` +
    `it says what comes next ${arahan}; emails sent to the new admin: ${after - before}`;
});

await step("S4", "Gladys grants Admin sekolah at SD's root (Konfigurasi → Peran & akses)", async (rec) => {
  // L3 (D-132 C7): Admin sekolah is given in the school's own context, Mengelola · SD, chosen first
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  // BOB19-K01 (the owner's ruling of 8 Oct, Option B; selector only): SD has no administrator yet, so its first is
  // appointed by «Menunjuk admin sekolah pertama», Admin sekolah at SD's root as before
  const r = await adminPertamaViaForm(g, people.sdAdmin.name);
  rec.shots.push(await shot(g, "grant-admin-result"));
  if (r.ok !== "ok") rec.verdict = "FAIL";
  return JSON.stringify(r);
});

const adminCtx = await ctx();
const a = await adminCtx.newPage();
await step("S5", "the school admin signs in", async (rec) => {
  const r = await magicSignIn(a, people.sdAdmin.email);
  rec.shots.push(await shot(a, "school-admin-landing"));
  return `landed on ${r.landed}`;
});

await step("S6", "the school admin's Orang list on day one (can they grant staff roles?)", async (rec) => {
  await a.goto(`${APP}/konfigurasi/roles#roles`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(a, "school-admin-konfigurasi"));
  const opts = await a.locator('select[name="person"] option').allTextContents().catch(() => []);
  const real = opts.filter((o) => o.trim() && !/pilih/i.test(o));
  if (real.length === 0) rec.verdict = "FAIL";
  return `people offered: ${real.length} (${real.slice(0, 5).join(" / ")})`;
});

// D-005 (1): the school builds its own structure. When the candidate carries
// the Struktur sekolah screen (DAISY-05), the school admin builds SD's Bagian,
// Tingkat and Kelas there, and W1 (the operator's SQL) is skipped.
const KIND = { bagian: "DEPARTMENT", tingkat: "COHORT", kelas: "CLASS" };
async function tambahDi(page, tingkatan, nama) {
  const f = page.locator(`div.pin-str-tambah-${tingkatan} form`).first();
  await f.locator('input[name="nama"]').fill(nama);
  await f.locator('button[type="submit"]').click();
  // wait for the row itself: the step guide above the tree already names "Kelas Rendah"
  for (let i = 0; i < 30; i++) {
    if (Number(sql(`select count(*) from public.org_nodes where institution_id='${ids.sd}' and kind='${KIND[tingkatan]}' and name='${nama}' and is_active`)) > 0) break;
    await page.waitForTimeout(500);
  }
  await page.waitForLoadState("networkidle");
}

// J3.2 (ADM-02): what the school admin's home says is done and what remains, by step
async function bacaPersiapan(page) {
  await page.goto(`${APP}/konfigurasi?muat=${Date.now()}#persiapan`, { waitUntil: "networkidle" });
  const out = {};
  for (const li of await page.locator("#persiapan li[data-langkah]").all()) {
    out[await li.getAttribute("data-langkah")] = (await li.getAttribute("data-selesai")) === "ya";
  }
  out.teks = norm(await page.locator("#persiapan").innerText().catch(() => ""));
  return out;
}

await step("S7", "the school admin builds SD's structure on a screen (Bagian, Tingkat, Kelas)", async (rec) => {
  await a.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  if (!(await a.locator("div.pin-str-tambah-bagian form").count())) {
    const found = [];
    for (const p of ["/konfigurasi", "/pendataan", "/studio"]) {
      await a.goto(`${APP}${p}`, { waitUntil: "networkidle" });
      if (/(buat|tambah)\s+(kelas|rombel|unit|jurusan|departemen)/i.test(await bodyText(a))) found.push(p);
    }
    rec.shots.push(await shot(a, "pendataan-admin"));
    rec.verdict = "BLOCKED";
    return found.length ? `class wording on ${found.join(", ")}, but no Struktur sekolah panel` : "no screen offers to create a class, department or cohort";
  }
  const steps = [];
  const count = (kind, name) => sql(`select count(*) from public.org_nodes where institution_id='${ids.sd}' and kind='${kind}' and name='${name}' and is_active`).trim();
  await tambahDi(a, "bagian", "Kelas Rendah");
  steps.push(`Bagian ${count("DEPARTMENT", "Kelas Rendah")}`);
  await tambahDi(a, "tingkat", "Kelas 1");
  steps.push(`Tingkat ${count("COHORT", "Kelas 1")}`);
  await tambahDi(a, "kelas", "Kelas 1A");
  const kl = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1A' and is_active limit 1`).trim();
  steps.push(`Kelas ${kl ? 1 : 0}`);
  rec.shots.push(await shot(a, "struktur-sekolah"));
  const hidden = /Jenjang|Reguler/.test(await a.locator("#struktur").innerText().catch(() => ""));
  steps.push(`hidden levels shown: ${hidden}`);
  if (kl) ids.klass = kl;
  // J3.2: with a Kelas and nobody in it yet, the home says the class is there and students and a teacher remain
  const siap = await bacaPersiapan(a);
  steps.push(`setup on the home: Kelas ${siap.kelas}, students ${siap.murid}, teacher ${siap.guru} ("${siap.teks.slice(0, 160)}")`);
  if (!kl || hidden || siap.kelas !== true || siap.murid !== false || siap.guru !== false || !/Kelas 1A/.test(siap.teks)) rec.verdict = "FAIL";
  const ladder = kl ? sql(`with recursive up as (select id, parent_id, kind::text k, 1 n from public.org_nodes where id='${kl}' union all select o.id, o.parent_id, o.kind::text, up.n + 1 from public.org_nodes o join up on o.id = up.parent_id) select string_agg(k, ' <- ' order by n) from up`).trim() : "-";
  return `${steps.join("; ")}; ladder: ${ladder}`;
});

await step("S7b", "Gladys (platform admin) opens Struktur sekolah: which school is chosen first?", async (rec) => {
  // L3: in Mengelola · SD the structure is SD's alone (never the library's, never another school's)
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  await g.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  // the choice already landed on /konfigurasi, so this is a hash change, not a load: wait for the panel itself
  await g.locator("div.pin-str-tambah-bagian form").first().waitFor({ timeout: SLOW }).catch(() => {});
  if (!(await g.locator("div.pin-str-tambah-bagian form").count())) { rec.verdict = "NOTE"; return "no Struktur sekolah panel"; }
  const chosen = (await g.locator('#struktur [aria-current="page"]').first().textContent().catch(() => null)) ?? "(single school)";
  const offered = await g.locator("#struktur nav a").allTextContents().catch(() => []);
  if (/Kurikulum Nasional/i.test(chosen) || offered.some((o) => /Kurikulum Nasional/i.test(o))) rec.verdict = "FAIL";
  return `preselected: "${chosen.trim()}"; offered: ${JSON.stringify(offered)}`;
});

let adminApi;
await step("S8", "intake with only the school's root as 'Tempat' (all a new school has)", async (rec) => {
  adminApi = await apiSession(people.sdAdmin.email);
  // ADM-J08: the school's code is set on the Pendataan screen, by the school admin
  await a.goto(`${APP}/pendataan`, { waitUntil: "networkidle" });
  await tutupTur(a);
  await a.locator("#pin-kode-isi").fill("SDZ");
  await a.getByRole("button", { name: "Simpan kode", exact: true }).click();
  // the page is already /pendataan, so wait for what the saved code opens: the list's paste box
  await a.locator("#pin-tempel").waitFor({ timeout: SLOW }).catch(() => {});
  await a.waitForLoadState("networkidle");
  const ns = sql(`select coalesce(namespace, '') from public.institutions where id='${ids.sd}'`).trim();
  if (ns !== "SDZ" || new URL(a.url()).searchParams.get("galat")) throw new Error(`the code was not saved on the screen: namespace «${ns}», ${a.url()}`);
  const rows = [{ display_name: "Ani Murid", node_id: ids.sd, role: "STUDENT" }, { display_name: "Pak Guru Tono", node_id: ids.sd, role: "EDUCATOR" }];
  const job = await adminApi.rpc("import_open", { p_institution: ids.sd, p_rows: rows });
  if (job.error) throw new Error(`open: ${job.error.message}`);
  const v = await adminApi.rpc("import_validate", { p_job: job.data });
  const c = await adminApi.rpc("import_confirm", { p_job: job.data });
  const log = [`validate: ${v.error?.message ?? JSON.stringify(v.data).slice(0, 160)}`, `confirm: ${c.error?.message ?? "ok"}`];
  for (let i = 0; i < 4; i++) {
    const adv = await adminApi.rpc("import_advance", { p_job: job.data, p_max_rows: 50 });
    log.push(`advance: ${adv.error?.message ?? JSON.stringify(adv.data).slice(0, 200)}`);
    if (adv.error && /pilot/i.test(adv.error.message)) {
      const vp = await adminApi.rpc("import_verify_pilot", { p_job: job.data });
      log.push(`verify_pilot: ${vp.error?.message ?? "ok"}`);
    }
  }
  // Restated 28 Sep (the requirement changed; S8 used to fail whenever a row was not recorded). A new school's
  // only place is its root, and neither row may be taken in there: a learner at the root is refused at
  // validation with a reason (BOB-01), and so is a staff row, until M5b (BOB-10), which before this went
  // through the learner branch and enrolled the teacher as a student. PASS: validation refuses BOTH rows, each
  // with a reason, nothing is recorded, and nobody is enrolled. FAIL: a row passes, or anyone is recorded.
  const hasil = Array.isArray(v.data?.rows) ? v.data.rows : [];
  const refused = hasil.filter((r) => r.ok === false && Array.isArray(r.problems) && r.problems.length > 0).length;
  const failed = sql(`select count(*) from public.import_rows r where r.job_id='${job.data}' and r.state::text <> 'PROVISIONED'`);
  const enrolled = sql(`select count(*) from public.enrollments e join public.persons p on p.id = e.person_id
                         where e.institution_id='${ids.sd}' and p.display_name in ('Ani Murid','Pak Guru Tono')
                           and e.created_at > now() - interval '10 minutes'`);
  if (v.error || v.data?.ok !== false || refused !== rows.length || Number(failed) !== rows.length || Number(enrolled) > 0) rec.verdict = "FAIL";
  log.push(`rows refused at validation with a reason: ${refused}/${rows.length}; enrolled: ${enrolled}`);
  ids.rootJob = job.data;
  return `${log.join(" | ")} | rows not recorded: ${failed}; row states: ${sql(`select string_agg(ordinal||':'||state::text, ',') from public.import_rows where job_id='${job.data}'`)}`;
});

await step("W1", "OPERATOR: build SD's tree down to a class (only when no screen built it)", async () => {
  if (ids.klass) return "skipped: S7 built Kelas 1A on the Struktur sekolah screen, so no operator step";
  const f = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name) values ('${ids.sd}','${ids.sd}','FACULTY','Jenjang SD') returning id`);
  const d = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name) values ('${ids.sd}','${f}','DEPARTMENT','Kelas Rendah') returning id`);
  const p = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name) values ('${ids.sd}','${d}','PROGRAMME','Program Reguler') returning id`);
  const co = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values ('${ids.sd}','${p}','COHORT','Angkatan 2026','${ids.period}') returning id`);
  const cl = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values ('${ids.sd}','${co}','CLASS','Kelas 1A','${ids.period}') returning id`);
  Object.assign(ids, { faculty: f, dept: d, programme: p, cohort: co, klass: cl });
  return "INSTITUTION → FACULTY → DEPARTMENT → PROGRAMME → COHORT → CLASS 'Kelas 1A' created by SQL";
});

await step("S9", "intake two students into Kelas 1A", async (rec) => {
  const rows = [{ display_name: "Ani Murid", node_id: ids.klass, role: "STUDENT" }, { display_name: "Budi Murid", node_id: ids.klass, role: "STUDENT" }];
  const job = await adminApi.rpc("import_open", { p_institution: ids.sd, p_rows: rows });
  if (job.error) throw new Error(job.error.message);
  const log = [];
  for (const fn of ["import_validate", "import_confirm"]) {
    const r = await adminApi.rpc(fn, { p_job: job.data });
    log.push(`${fn}: ${r.error?.message ?? "ok"}`);
  }
  for (let i = 0; i < 4; i++) {
    const adv = await adminApi.rpc("import_advance", { p_job: job.data, p_max_rows: 50 });
    log.push(`advance: ${adv.error?.message ?? JSON.stringify(adv.data).slice(0, 160)}`);
    if (adv.error && /pilot/i.test(adv.error.message)) {
      const vp = await adminApi.rpc("import_verify_pilot", { p_job: job.data });
      log.push(`verify_pilot: ${vp.error?.message ?? "ok"}`);
    }
  }
  const states = sql(`select string_agg(ordinal||':'||state::text, ',') from public.import_rows where job_id='${job.data}'`);
  const enrolled = sql(`select count(*) from public.enrollments e where e.institution_id='${ids.sd}'`);
  if (Number(enrolled) < 2) rec.verdict = "FAIL";
  return `${log.join(" | ")} | row states ${states}; enrolments at SD: ${enrolled}`;
});

let card;
await step("S10", "the school admin makes a class card for one student by clicking (/aktivasi → Buat kartu kelas)", async (rec) => {
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(a, "aktivasi-admin"));
  // ADM-J10: the card button itself, on Ani's own row (M7 keeps single issue for exceptions)
  const baris = a.locator("li.pin-akt-orang", { hasText: "Ani Murid" }).first();
  if (!(await baris.count())) { rec.verdict = "FAIL"; return `Ani is not listed on Aktivasi: ${(await bodyText(a)).slice(0, 300)}`; }
  await baris.getByRole("button", { name: "Buat kartu kelas", exact: true }).click();
  await baris.locator("strong.pin-num").nth(1).waitFor({ timeout: SLOW });
  const [nomor, pin] = await baris.locator("strong.pin-num").allInnerTexts();
  rec.shots.push(await shot(a, "aktivasi-kartu-ani"));
  if (!/^\d{10}$/.test(nomor ?? "") || !/^\d{6}$/.test(pin ?? "")) { rec.verdict = "FAIL"; return `the row reads: ${norm(await baris.innerText()).slice(0, 200)}`; }
  card = { number: nomor, pin };
  return `card made by clicking on Ani's row (number ${nomor.length} digits, PIN ${pin.length} digits)`;
});

await step("S11", "the student signs in with the class card", async (rec) => {
  if (!card) { rec.verdict = "BLOCKED"; return "no card"; }
  const sc = await ctx();
  const s = await sc.newPage();
  await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await s.locator("#kartu").fill(card.number);
  await s.locator("#pin").fill(card.pin);
  await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await s.waitForTimeout(4000);
  await s.waitForLoadState("networkidle");
  rec.shots.push(await shot(s, "student-after-card-signin"));
  const landed = new URL(s.url()).pathname;
  await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(s, "student-belajar"));
  const t = await bodyText(s);
  const out = await hasSignOut(s);
  if (landed === "/masuk") rec.verdict = "FAIL";
  return `landed on ${landed}; /belajar says: ${t.slice(0, 220)}; sign-out control on /belajar: ${out}`;
});

// ADM-J06, ADM-J07: the school admin adds a teacher with the school's own tools: the teacher is recorded by
// name on Pendataan (a staff row carries no place and no role), gets an account by email on Aktivasi, and is
// given Guru at Kelas 1A on Peran & akses. Gladys (platform admin) is not involved.
await step("S12", "the school admin adds the teacher: by name on Pendataan, an account by email on Aktivasi, Guru at Kelas 1A on Peran & akses (ADM-J06, ADM-J07)", async (rec) => {
  const jejak = [await catatLewatLayar(a, [people.guru.name], rec.shots, { kelas: null, peran: null })];
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  const baris = a.locator("li.pin-akt-orang", { hasText: people.guru.name }).first();
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    return `${jejak.join(" | ")}; ${people.guru.name} is not on Aktivasi: ${norm(await bodyText(a)).slice(0, 300)}`;
  }
  await baris.locator('input[type="email"]').fill(people.guru.email);
  await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
  await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  rec.shots.push(await shot(a, "aktivasi-guru"));
  const akun = sql(`select count(*) from public.accounts ac join public.persons p on p.id = ac.person_id where p.display_name='${people.guru.name}'`).trim();
  jejak.push(`Aktivasi by email: accounts for ${people.guru.name}: ${akun}`);
  const r = await grantViaForm(a, people.guru.name, "EDUCATOR", "Kelas 1A");
  rec.shots.push(await shot(a, "grant-guru-result"));
  if (r.ok !== "ok" || akun !== "1") rec.verdict = "FAIL";
  return `${jejak.join(" | ")} | the school admin's grant: ${JSON.stringify(r)}`;
});

// J3.2 (ADM-02): once the class has its students (S9) and its teacher (S12), the home says setup is done
await step("S12b", "the school admin's home says the setup is done: a Kelas, its students, its teacher (ADM-J02)", async (rec) => {
  const siap = await bacaPersiapan(a);
  rec.shots.push(await shot(a, "adm-j02-persiapan"));
  if (siap.kelas !== true || siap.murid !== true || siap.guru !== true) rec.verdict = "FAIL";
  return `Kelas ${siap.kelas}, students ${siap.murid}, teacher ${siap.guru}: "${siap.teks.slice(0, 220)}"`;
});

await step("S13", "the teacher signs in and opens the class", async (rec) => {
  const tc = await ctx();
  const t = await tc.newPage();
  const r = await magicSignIn(t, people.guru.email);
  await t.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(t, "teacher-mengajar"));
  const txt = await bodyText(t);
  const sees = /Kelas 1A/.test(txt);
  const klassHref = await t.locator('a[href^="/mengajar/"]').first().getAttribute("href").catch(() => null);
  let siapkan = "";
  if (klassHref) {
    await t.goto(`${APP}${klassHref.split("?")[0].replace(/\/$/, "")}/siapkan`, { waitUntil: "networkidle" });
    rec.shots.push(await shot(t, "teacher-siapkan"));
    siapkan = (await bodyText(t)).slice(0, 260);
  }
  // CROSS-BATCH (6 Nov): the role S12 granted on Peran & akses reaches the teacher's own Digital Card on Akun saya
  // (D-059: the card's lines are read from the current role assignments), named with its school
  const sekolahSd = sql(`select name from public.institutions where id='${ids.sd}'`).trim();
  await t.goto(`${APP}/akun`, { waitUntil: "networkidle" });
  const kartu = t.locator(".pin-kd-peran").first();
  const adaKartu = await kartu.waitFor({ timeout: 15000 }).then(() => true).catch(() => false);
  const kartuTeks = adaKartu ? (await t.locator(".pin-idn").innerText()).replace(/\s+/g, " ") : "";
  rec.shots.push(await shot(t, "teacher-kartu-digital"));
  const kartuBenar = adaKartu && /\bGuru\b/.test(kartuTeks) && kartuTeks.includes(sekolahSd);
  if (!sees || !kartuBenar) rec.verdict = "FAIL";
  return `landed on ${r.landed}; sees Kelas 1A: ${sees}; sign-out control: ${await hasSignOut(t)}; siapkan says: ${siapkan}; `
    + `the Digital Card names «Guru» at «${sekolahSd}»: ${kartuBenar}`;
});

// SD's course and lesson counts (a declaration, so S14 can use it before `hitung` below exists)
function hitungSd() {
  const q = (t) => sql(t).trim();
  return {
    courses: q(`select count(*) from public.courses where institution_id='${ids.sd}'`),
    lessons: q(`select count(*) from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id where c.institution_id='${ids.sd}'`),
  };
}

// S14 -- the way Gladys uploads. Since DAISY-06 the page opens on the workbook panel:
// a school, an .xlsx, "Periksa buku kerja", the media the workbook names, "Simpan ke
// Studio". The candidate's own sample workbook (BOB-02) is the file; the media are small
// stand-ins carrying the names the workbook gives them. A candidate without the panel
// gets the old Unggah Mudah probe, which fails as B2 recorded.
await step("S14", "Gladys uploads a lesson: the Excel workbook (DAISY-06)", async (rec) => {
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "studio-unggah"));
  const panel = g.locator("#ung-berkas");
  const buku = join(process.env.APP_DIR, "selftest/fixtures/bob02/contoh-pelajaran.xlsx");
  const paketBuku = join(process.env.APP_DIR, "selftest/fixtures/bob02/contoh-pelajaran.paket.json");
  if (await panel.count() && existsSync(buku) && existsSync(paketBuku)) {
    const notes = [];
    const beforeSd = hitungSd();
    const sel = g.locator("#ung-sekolah");
    const preselected = (await sel.locator("option:checked").textContent().catch(() => ""))?.trim();
    const offered = await sel.locator("option").allTextContents();
    notes.push(`school preselected: "${preselected}"; offered: ${JSON.stringify(offered.map((x) => x.trim()))}`);
    const v = await sel.locator("option").filter({ hasText: "SD Zayd" }).first().getAttribute("value").catch(() => null);
    if (v) await sel.selectOption(v);
    await panel.setInputFiles(buku);
    await g.getByRole("button", { name: "Periksa buku kerja" }).click();
    const lolos = await g.getByText("Buku kerja lolos pemeriksaan.").waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
    rec.shots.push(await shot(g, "studio-unggah-periksa"));
    notes.push(`check: ${lolos ? "passed" : "did not pass"}`);
    if (lolos) {
      // stand-in media, named as the workbook names them
      const dir = join(OUT, "media-s14");
      mkdirSync(dir, { recursive: true });
      const names = JSON.parse(readFileSync(paketBuku, "utf8")).courses
        .flatMap((c) => c.modules.flatMap((m) => m.lessons.flatMap((l) => (l.media ?? []).map((x) => x.file))));
      const files = names.map((n) => { const f = join(dir, n); writeFileSync(f, `audit stand-in for ${n}`); return f; });
      if (files.length) {
        await g.locator("#ung-media").setInputFiles(files);
        await g.getByRole("button", { name: "Unggah media" }).click();
        const all = `${files.length} / ${files.length}`;
        const done = await g.getByText(new RegExp(`^${all.replace(/ /g, "\\s")}`)).waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
        notes.push(`media: ${files.length} named, all uploaded: ${done}`);
      }
      await g.getByRole("button", { name: "Simpan ke Studio" }).click();
      const saved = await g.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
      rec.shots.push(await shot(g, "studio-unggah-simpan"));
      notes.push(`saved: ${saved}`);
    }
    const afterSd = hitungSd();
    notes.push(`at SD: courses ${beforeSd.courses} → ${afterSd.courses}, lessons ${beforeSd.lessons} → ${afterSd.lessons}`);
    if (!lolos || Number(afterSd.courses) <= Number(beforeSd.courses) || Number(afterSd.lessons) <= Number(beforeSd.lessons)
        || /Kurikulum Nasional/.test(preselected ?? "")) rec.verdict = "FAIL";
    return notes.join("; ");
  }
  // older candidates: the Unggah Mudah probe B2 recorded
  const selects = g.locator("select");
  const firstSchool = (await selects.count()) ? await selects.first().locator("option:checked").textContent() : "(no select)";
  const fileInputs = await g.locator('input[type="file"]').count();
  const form = g.locator("form").filter({ has: g.locator('textarea[name="isi"]') }).first();
  const sel = form.locator("select").first();
  if (await sel.count()) {
    const v = await sel.locator("option").filter({ hasText: "SD Zayd" }).first().getAttribute("value");
    if (v) await sel.selectOption(v);
  }
  await form.locator('textarea[name="isi"]').fill(JSON.stringify({ files: [{ path: "bab-1-penjumlahan.md" }, { path: "soal-bab-1.csv" }, { path: "materi.pdf" }] }));
  await form.locator('button[type="submit"]').first().click();
  await g.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
  await g.waitForLoadState("networkidle");
  rec.shots.push(await shot(g, "studio-unggah-mudah-result"));
  const u = new URL(g.url());
  const confirmBtn = g.getByRole("button", { name: "Konfirmasi" }).first();
  let confirm = "no Konfirmasi button offered";
  if (await confirmBtn.count()) {
    await confirmBtn.click();
    await g.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
    await g.waitForLoadState("networkidle");
    rec.shots.push(await shot(g, "studio-unggah-mudah-confirm"));
    const u2 = new URL(g.url());
    confirm = `confirm → hasil=${u2.searchParams.get("hasil")} detail=${u2.searchParams.get("detail")}`;
  }
  const courses = sql(`select count(*) from public.courses where institution_id='${ids.sd}'`);
  if (Number(courses) === 0) rec.verdict = "FAIL";
  return `file inputs on page: ${fileInputs}; school preselected: "${firstSchool?.trim()}"; submit → hasil=${u.searchParams.get("hasil")} detail=${u.searchParams.get("detail")}; ${confirm}; courses at SD: ${courses}`;
});

// BOB-02's sample package, when the candidate carries it: the whole course, its
// media uploaded through the real upload route, then the batch's own Konfirmasi.
// Older candidates get the one-course JSON the audit has always used.
const PAKET = join(process.env.APP_DIR, "selftest/fixtures/bob02/contoh-pelajaran.paket.json");
const paketContoh = existsSync(PAKET) ? readFileSync(PAKET, "utf8") : null;
const paketLama = JSON.stringify({ courses: [{ subject: "Matematika", stage: "SD", grade_label: "Kelas 1", title: "Penjumlahan sampai 20" }] });

async function kirimPaket(schoolText, isi, forgedId = null) {
  // Since BOB-07 the redirect carries no batch id (codes only), so the new batch is read from the database.
  const newest = () => sql(`select coalesce((select id::text from public.ingest_batches order by created_at desc, id desc limit 1), '')`).trim();
  const sebelum = newest();
  // L3 (D-132 C8): a package is aimed at the working context's school, chosen on the chooser first
  await keKonteks(g, { tujuan: "MENGELOLA", nama: schoolText });
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  // Since polish batch 2 (UX-12) the two JSON forms wait in a closed disclosure
  // below the workbook, as a person finds them; open it the way they would.
  const lain = g.locator("details#sistem-lain");
  if (await lain.count() && !(await lain.evaluate((d) => d.open))) await lain.locator("summary").click();
  const form = g.locator("form").filter({ has: g.locator('textarea[name="isi"]') }).nth(1);
  const sel = form.locator("select").first();
  let chosen = false;
  if (forgedId && await sel.count()) {
    // a request the page would never build: the school's value set by hand
    await sel.evaluate((el, id) => { const o = document.createElement("option"); o.value = id; o.textContent = "forged"; el.appendChild(o); el.value = id; }, forgedId);
    chosen = true;
  } else if (await sel.count()) {
    const v = await sel.locator("option").filter({ hasText: schoolText }).first().getAttribute("value").catch(() => null);
    if (v) { await sel.selectOption(v); chosen = true; }
  } else {
    const v = await g.locator("select").first().locator("option").filter({ hasText: schoolText }).first().getAttribute("value").catch(() => null);
    if (v) { await g.locator("select").first().selectOption(v); chosen = true; }
  }
  await form.locator('textarea[name="isi"]').fill(isi);
  await form.locator('button[type="submit"]').first().click();
  await g.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
  await g.waitForLoadState("networkidle");
  const u = new URL(g.url());
  const detail = u.searchParams.get("detail");
  const sesudah = newest();
  const batch = /^[0-9a-f-]{36}$/.test(detail ?? "") ? detail : (sesudah && sesudah !== sebelum ? sesudah : null);
  return { chosen, hasil: u.searchParams.get("hasil"), detail, batch };
}

const hitung = (inst) => {
  const q = (t) => sql(t).trim();
  return {
    courses: q(`select count(*) from public.courses where institution_id='${inst}'`),
    lessons: q(`select count(*) from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id where c.institution_id='${inst}'`),
  };
};

await step("S15", "Gladys uploads a lesson: Paket Terstruktur", async (rec) => {
  const r = await kirimPaket("SD Zayd", paketContoh ?? paketLama);
  rec.shots.push(await shot(g, "studio-terstruktur-result"));
  const notes = [`package: ${paketContoh ? "BOB-02 sample (workbook fixture)" : "one-course JSON"}`, `submit → hasil=${r.hasil} detail=${r.detail}`];
  const batch = r.batch;
  if (batch) {
    // media: sign each path the batch names, as Gladys, and upload through the signed URL
    const media = JSON.parse(sql(`select coalesce(inferred_mapping, '[]'::jsonb) from public.ingest_batches where id='${batch}'`) || "[]");
    let uploaded = 0;
    for (const m of Array.isArray(media) ? media : []) {
      if (!m?.path) continue;
      const signed = await g.evaluate(async (path) => {
        const res = await fetch("/api/assets/upload-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path }) });
        return { status: res.status, body: await res.json().catch(() => null) };
      }, m.path);
      if (signed.status !== 200 || !signed.body?.token) { notes.push(`upload-url ${m.path}: HTTP ${signed.status}`); continue; }
      const put = await fetch(`${SB}/storage/v1/object/upload/sign/assets/${signed.body.path}?token=${encodeURIComponent(signed.body.token)}`, {
        method: "PUT", headers: { "content-type": "application/octet-stream" }, body: Buffer.from(`audit media for ${m.path}`),
      });
      if (put.ok) uploaded += 1; else notes.push(`upload ${m.path}: HTTP ${put.status}`);
    }
    notes.push(`media uploaded: ${uploaded}/${Array.isArray(media) ? media.length : 0}`);
    // the batch's own Konfirmasi on today's page
    await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
    const btn = g.locator(`form:has(input[name="batch"][value="${batch}"]) button[type="submit"]`).first();
    if (await btn.count()) {
      await btn.click();
      await g.waitForURL(/hasil=/, { timeout: 20000 }).catch(() => {});
      await g.waitForLoadState("networkidle");
      rec.shots.push(await shot(g, "studio-terstruktur-confirm"));
      const u2 = new URL(g.url());
      notes.push(`confirm → hasil=${u2.searchParams.get("hasil")} detail=${u2.searchParams.get("detail")}`);
    } else notes.push("no Konfirmasi offered for this batch");
    notes.push(`batch status: ${sql(`select status from public.ingest_batches where id='${batch}'`).trim()}`);
  }
  const n = hitung(ids.sd);
  const items = sql(`select count(*) from public.items where institution_id='${ids.sd}'`).trim();
  notes.push(`at SD: courses ${n.courses}, lessons ${n.lessons}, items ${items}`);
  if (Number(n.lessons) === 0) rec.verdict = "FAIL";
  return notes.join("; ");
});

await step("S15b", "D-029, D-120 Q7, L3 C7: the canonical library is the platform admin's own place: never offered in a school's context, offered alone once she chooses Pustaka PINTAR, and nothing is sent", async (rec) => {
  // RESTATED FOR CR-51 (D-120 Q7, a changed requirement): the platform admin now prepares the library's standard content
  // through this page, so a package sent here would be accepted and would add a course to this database's library. The
  // step reads the picker instead and sends nothing. That every SCHOOL role is still refused at the library is the
  // database's (F11-N02, F12-N01 in CI).
  // RESTATED FOR L3 (D-132 C7, C8): the library is a place of its own, chosen deliberately on the chooser. In a school's
  // context the picker offers that school alone and the library never (no upload reaches it by default); in Pustaka
  // PINTAR's it offers the library alone. D-120 Q7's «never preselected» becomes «never offered until chosen».
  const inst = sql(`select id from public.institutions where tenant_kind='PLATFORM_CANONICAL' limit 1`).trim();
  if (!inst) { rec.verdict = "NOTE"; return "no canonical tenant in this database"; }
  const before = hitung(inst);
  const pemilih = async () => {
    await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
    const sel = g.locator("#ung-sekolah");
    return (await sel.count()) ? (await sel.locator("option").allTextContents()).map((x) => x.trim()) : [];
  };
  const diSekolah = await pemilih();
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "Kurikulum Nasional" });
  const diPustaka = await pemilih();
  rec.shots.push(await shot(g, "studio-pustaka"));
  // back to the school's context the walk works in
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  const after = hitung(inst);
  const pustaka = (xs) => xs.filter((x) => /Kurikulum Nasional/.test(x)).length;
  if (!diSekolah.length && !diPustaka.length) rec.verdict = "NOTE";
  else if (pustaka(diSekolah) !== 0 || diSekolah.length !== 1 || diPustaka.length !== 1 || pustaka(diPustaka) !== 1
           || after.courses !== before.courses) rec.verdict = "FAIL";
  return `in Mengelola · SD the picker offers ${JSON.stringify(diSekolah)} (the library ${pustaka(diSekolah)} time(s)); in Pustaka PINTAR ${JSON.stringify(diPustaka)}; canonical courses ${before.courses} → ${after.courses} (nothing sent)`;
});

// F-4 (D-145(b)): the synthetic SD Kelas 5 Matematika Bab 1 («Matematika Kelas 5 · Bab 1: Pola Bilangan»), from
// docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.xlsx (the real chapter and its key left the public tree),
// converted by the app's own bukuKerjaKePaket. Imported through today's page into SD, then its
// course page is captured, so the chapter can be seen before any school has it.
await step("S15c", "SD 5 Matematika Bab 1 (synthetic chapter, F-4) imports whole into SD", async (rec) => {
  const f = new URL("./fixtures/sd5-sintetis-bab1.paket.json", import.meta.url);
  if (!existsSync(f) || !paketContoh) { rec.verdict = "NOTE"; return "candidate predates BOB-02, or the chapter fixture is absent"; }
  const before = hitung(ids.sd);
  const r = await kirimPaket("SD Zayd", readFileSync(f, "utf8"));
  const notes = [`submit → hasil=${r.hasil} detail=${r.detail}`];
  const batch = r.batch;
  if (batch) {
    await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
    const btn = g.locator(`form:has(input[name="batch"][value="${batch}"]) button[type="submit"]`).first();
    if (await btn.count()) {
      await btn.click();
      await g.waitForLoadState("networkidle");
      await g.waitForTimeout(1500);
      rec.shots.push(await shot(g, "sd5-bab1-kursus"));
      await g.setViewportSize({ width: 1280, height: 4000 });
      rec.shots.push(await shot(g, "sd5-bab1-kursus-panjang"));
      await g.setViewportSize({ width: 1280, height: 800 });
      notes.push(`after confirm: ${new URL(g.url()).pathname}`);
    } else notes.push("no Konfirmasi offered for this batch");
    notes.push(`batch status: ${sql(`select status from public.ingest_batches where id='${batch}'`).trim()}`);
  }
  const after = hitung(ids.sd);
  const course = sql(`select id from public.courses where institution_id='${ids.sd}' and title like 'Matematika Kelas 5%' limit 1`).trim();
  const items = course ? sql(`select count(*) from public.items i join public.lessons l on l.id=i.lesson_id join public.modules m on m.id=l.module_id where m.course_id='${course}'`).trim() : "0";
  const tags = course ? sql(`select coalesce(string_agg(r||':'||n, ', '),'-') from (select coalesce(i.cycle_role::text,'LATIHAN') r, count(*) n from public.items i join public.lessons l on l.id=i.lesson_id join public.modules m on m.id=l.module_id where m.course_id='${course}' group by 1 order by 1) x`).trim() : "-";
  notes.push(`SD courses ${before.courses} → ${after.courses}, lessons ${before.lessons} → ${after.lessons}; this course: items ${items} (${tags})`);
  // the chapter as its package has it (CR-82: nothing here is a written-in number; F-4: the fixture is the synthetic corpus's)
  const paketBab1 = JSON.parse(readFileSync(f, "utf8"));
  const nSoal = paketBab1.courses.reduce((n, c) => n + c.modules.reduce((m, md) => m + md.lessons.reduce((k, l) => k + (l.items ?? []).length, 0), 0), 0);
  const kodeMis = (paketBab1.misconceptions ?? []).map((x) => x.code);
  const misSd = kodeMis.length ? Number(sql(`select count(*) from public.misconception_taxonomy where institution_id='${ids.sd}' and code in (${kodeMis.map((k) => `'${k}'`).join(",")})`).trim()) : 0;
  notes.push(`the package: ${nSoal} question(s), ${kodeMis.length} misconception definition(s); SD now holds ${misSd} of them (CR-50: a package carries its own definitions)`);
  if (!course || Number(items) !== nSoal || kodeMis.length === 0 || misSd !== kodeMis.length) rec.verdict = "FAIL";
  return notes.join("; ");
});

await step("S16", "Head of department: sees reports on /pimpinan", async (rec) => {
  // RESTATED FOR BOB19-K01 (the owner's ruling of 8 Oct, Option B, approving this procedural restatement): SD has its
  // administrator, so its new staff are SD's own people. Gladys, Admin platform in Mengelola · SD as before, records the
  // Kepala departemen with SD's own tool (Pendataan) and activates her (Aktivasi), where «Orang baru di luar pendataan»
  // made her before, then grants Kepala departemen at Kelas Rendah from SD's list. Actor, school, role and assertions
  // are unchanged.
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  await catatDanAktifkan(g, people.kaprodi, rec.shots);
  const r = await grantViaForm(g, people.kaprodi.name, "HEAD_OF_DEPARTMENT", "Kelas Rendah");
  const hc = await ctx();
  const h = await hc.newPage();
  const s = await magicSignIn(h, people.kaprodi.email);
  await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(h, "kaprodi-pimpinan"));
  const t = await bodyText(h);
  return `grant ok=${r.ok}; landed ${s.landed}; /pimpinan says: ${t.slice(0, 320)}; sign-out control: ${await hasSignOut(h)}`;
});

// ── Public and anonymous probes (checklist PUB-02, PUB-04, U-LOC) ─────────────
// ───────────────────────────── D-005 end to end: the real chapter from Studio to a learner
// S17 takes S15c's SD 5 Bab 1 through the package page's seven steps (DAISY-06's Terbit step)
// with two people, as the four-eyes rule wants: Gladys, its author, puts it together, checks it
// and sends it for review; the school admin approves it, creates the release and locks it;
// Gladys publishes. S18: the teacher assigns it to Kelas 1A on Siapkan (BOB-04's
// assign_release, both tests with it). S19: the student opens it and reaches the pre-test.
const TERBIT = [
  ["susun", "Tandai sudah tersusun", "g"], ["periksa", "Tandai lolos pemeriksaan", "g"],
  ["ajukan", "Ajukan untuk ditinjau", "g"], ["setujui", "Setujui isi", "a"],
  ["buat", "Buat terbitan", "a"], ["kunci", "Kunci terbitan", "a"], ["terbitkan", "Terbitkan", "g"],
];
// Bab 1 by its own title: S26d imports Bab 2 ("Matematika Kelas 5 · Bab 2: …"), which must never stand in for it
const babSatu = () => sql(`select id from public.courses where institution_id='${ids.sd}' and title like 'Matematika Kelas 5%' and title like '%Bab 1:%' order by created_at desc limit 1`).trim();
const keadaanBab = (c) => sql(`select c.status || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id='${c}'`).trim();
let terbitBab = false;

// the package page's own words from the step list on, for a record of what it said
const kataLangkah = async (page) => { const t = await bodyText(page); const i = t.indexOf("Langkah menuju terbit"); return (i >= 0 ? t.slice(i) : t).slice(0, 320); };
// the blockers as text whatever their shape: a text[] of sentences before BOB-17, a jsonb list of codes after it
// (the audit also runs against older releases, production's among them)
const siap = (c) => sql(`select status || ' | ' || coalesce(blockers::text, '') from public.publish_readiness('${c}')`).trim();

// The seven steps on the package page with two people (DAISY-06, BOB-03): Gladys, the author, puts it together, checks
// it, sends it for review and publishes; the school admin approves, creates the release and locks it; the author is
// never offered the second person's step; each WARNING finding is reviewed before publishing. `bacaSoal` adds
// D-088(h)'s check that the reviewer reads every question, key and reason before «Setujui isi». False when a step failed
// (the reason is in `notes`, the verdict set).
// `peninjau` (HOD-04, GS-09): the page that takes the reviewer's steps (approve, make and lock the release) and reads the
// questions first; the school admin by default.
// `tanpaLemah` (CR-50, CR-82): the chapter is the synthetic corpus's (F-4; once PINTAR's regenerated content), every wrong option naming a misconception
// its package defines (PENUTUPAN-M04), so its review must raise no WEAK_MISCONCEPTION_LINKAGE finding (F20-M03 in the
// database; here through the screens).
async function terbitkanLewatLayar(course, rec, notes, { bacaSoal = false, nama = "Bab 1", awalan = "", antrean = null, peninjau = null, tanpaLemah = false } = {}) {
  const pen = peninjau ?? a;
  const siapaPen = peninjau ? "the head of department" : "the school admin";
  // press a step's button as `page`; the state it moved to, or null when nothing moved
  const tekan = async (page, kunci, tombol) => {
    await page.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
    let btn = page.getByRole("button", { name: tombol, exact: true });
    // W1.4 (Batch 3): a reader who may also lock the release creates and locks it in one press, «Kunci terbitan» in
    // the «Buat terbitan · Kunci terbitan» panel; that press must end with the release locked
    let gabung = false;
    if (kunci === "buat" && !(await btn.count())) {
      btn = page.getByRole("button", { name: "Kunci terbitan", exact: true });
      gabung = true;
    }
    if (!(await btn.count())) return { tidakAda: true };
    const before = keadaanBab(course);
    await btn.first().click();
    let after = before;
    for (let i = 0; i < 40 && after === before; i++) { await page.waitForTimeout(500); after = keadaanBab(course); }
    for (let i = 0; gabung && i < 40 && !after.endsWith("|FROZEN"); i++) { await page.waitForTimeout(500); after = keadaanBab(course); }
    if (gabung) notes.push(`W1.4: «Buat terbitan» and «Kunci terbitan» in one press → ${after}`);
    await page.waitForLoadState("networkidle");
    rec.shots.push(await shot(page, `${awalan}terbit-${kunci}${after === before ? "-ditolak" : ""}`));
    return { after: after === before ? null : after, gabung };
  };
  if (antrean) await antrean("sebelum");
  let sudahDikunci = false;
  for (const [kunci, tombol, siapa] of TERBIT) {
    // the combined press already locked the release (W1.4): the lock step is done
    if (kunci === "kunci" && sudahDikunci) { notes.push("kunci → done in the same press as buat (W1.4)"); continue; }
    const page = siapa === "g" ? g : ["setujui", "buat", "kunci"].includes(kunci) ? pen : a;
    if (kunci === "setujui" && antrean) await antrean("diajukan");
    if (siapa === "a" && ["setujui", "kunci"].includes(kunci)) {
      // a second person's step: the author must not be offered it
      await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
      if (await g.getByRole("button", { name: tombol, exact: true }).count()) { notes.push(`!! the author is offered "${tombol}"`); rec.verdict = "FAIL"; }
    }
    if (kunci === "setujui" && bacaSoal) {
      // D-088(h): before approving, the reviewer has the chapter's questions in front of them, each with its key and
      // every option's reason, on the package page (the learner preview stays without questions)
      // A1 (D-166(b)): one whole lesson per view, so the reviewer reads the package lesson by lesson (?pelajaran=n),
      // and every question, key and reason must be met across them
      await pen.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
      const nPelajaran = Math.max(1, await pen.locator("#soal #pin-soal-pilih option").count());
      let diLayar = 0, kunciLayar = 0, alasanLayar = 0;
      for (let i = 1; i <= nPelajaran; i++) {
        if (i > 1) await pen.goto(`${APP}/studio/paket/${course}?pelajaran=${i}#pin-soal-pelajaran`, { waitUntil: "networkidle" });
        diLayar += await pen.locator("#soal li.pin-soal").count();
        kunciLayar += await pen.locator("#soal li.pin-opsi-kunci").count();
        alasanLayar += await pen.locator("#soal li.pin-opsi").count();
      }
      await pen.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
      const diBank = Number(sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}'`));
      const opsiBank = Number(sql(`select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}'`));
      const kunciBank = Number(sql(`select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}' and o.is_correct`));
      rec.shots.push(await shot(pen, `${awalan}terbit-soal-ditinjau`));
      notes.push(`D-088(h) ${siapaPen}, reviewing, reads ${diLayar} of ${diBank} questions, ${alasanLayar} of ${opsiBank} options with their reason, ${kunciLayar} of ${kunciBank} keys marked`);
      if (diBank === 0 || diLayar !== diBank || kunciLayar !== kunciBank || alasanLayar !== opsiBank) rec.verdict = "FAIL";
    }
    if (kunci === "terbitkan") {
      // publishing wants every content-check finding reviewed (publish_readiness)
      const mutu = sql(`select coalesce(string_agg(severity || ' ' || pattern_class || ' x' || n, ', ' order by severity, pattern_class), 'none')
        from (select severity::text, pattern_class, count(*) n from public.mcq_quality_findings where course_id='${course}' group by 1, 2) x`).trim();
      const teks = sql(`select coalesce(string_agg(severity || ' x' || n, ', '), 'none') from (select severity::text, count(*) n from public.coaching_findings where course_id='${course}' group by 1) x`).trim();
      notes.push(`findings on ${nama}: question quality ${mutu}; student text ${teks}`);
      if (tanpaLemah) {
        const lemah = Number(sql(`select count(*) from public.mcq_quality_findings where course_id='${course}' and pattern_class = 'WEAK_MISCONCEPTION_LINKAGE'`).trim());
        notes.push(`CR-50/CR-82: WEAK_MISCONCEPTION_LINKAGE findings on ${nama}: ${lemah} (must be 0: every wrong option of the chapter names one)`);
        if (lemah !== 0) rec.verdict = "FAIL";
      }
      const r0 = siap(course);
      notes.push(`readiness: ${r0}`);
      if (!r0.startsWith("READY")) {
        const t = await tekan(g, kunci, tombol);
        notes.push(`publishing before the review: ${t.tidakAda ? "no button" : t.after ? `moved to ${t.after} (!!)` : `refused; the page says: ${await kataLangkah(g)}`}`);
        if (t.after) { rec.verdict = "FAIL"; return false; }
        if (r0.startsWith("BLOCKED")) { rec.verdict = "FAIL"; notes.push("ERROR findings: the content must be corrected before it can be published"); return false; }
        // the second person reviews each WARNING on the package page
        let reviewed = 0;
        for (let i = 0; i < 60; i++) {
          await a.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
          // W1.5 (Batch 3): findings of one kind are acknowledged together («Sudah saya tinjau semuanya»)
          const ack = a.getByRole("button", { name: /^Sudah saya tinjau( semuanya)?$/ });
          if (!(await ack.count())) break;
          const open = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id='${course}' and acknowledged_at is null)
            + (select count(*) from public.coaching_findings where course_id='${course}' and acknowledged_at is null)`));
          const n0 = open();
          await ack.first().click();
          for (let k = 0; k < 20 && open() === n0; k++) await a.waitForTimeout(300);
          reviewed += 1;
        }
        rec.shots.push(await shot(a, `${awalan}terbit-temuan-ditinjau`));
        notes.push(`the school admin reviewed ${reviewed} finding(s); readiness now: ${siap(course)}`);
      }
    }
    const t = await tekan(page, kunci, tombol);
    const who = siapa === "g" ? "Gladys" : page === pen ? siapaPen : "the school admin";
    if (t.tidakAda) { notes.push(`${kunci}: no "${tombol}" button for ${who}; state ${keadaanBab(course)}; the page says: ${await kataLangkah(page)}`); rec.verdict = "FAIL"; return false; }
    if (!t.after) { notes.push(`${kunci}: pressed by ${who}, nothing moved (${keadaanBab(course)}); the page says: ${await kataLangkah(page)}`); rec.verdict = "FAIL"; return false; }
    notes.push(`${kunci} → ${t.after}`);
    if (t.gabung) {
      if (!t.after.endsWith("|FROZEN")) { notes.push(`the combined press left ${t.after}, not a locked release`); rec.verdict = "FAIL"; return false; }
      sudahDikunci = true;
    }
  }
  return true;
}

// D-084 J4.4 (HOD-03): the head of department's review queue, read by clicking Studio → «Antrean Tinjauan»: before Bab 1
// is sent it says honestly that nothing waits; once sent it lists Bab 1, which opens on its package page with «Setujui
// isi» offered. Read during S17 (the head of department only looks; the school admin still approves) and judged in S17t.
let antreanKaprodi = null;
async function lihatAntreanKaprodi(course) {
  const hasil = { sebelum: null, diajukan: null, gagal: null };
  const hc = await ctx();
  const h = await hc.newPage();
  const judul = sql(`select title from public.courses where id='${course}'`).trim();
  const buka = async () => {
    await h.goto(`${APP}/studio`, { waitUntil: "networkidle" });
    await h.getByRole("link", { name: /Antrean Tinjauan/ }).first().click();
    await h.waitForURL((u) => u.pathname === "/studio/tinjau", { timeout: SLOW });
    // the page's own heading, not the nav link of the same name: until it shows, the page still says «Memuat halaman…»
    await h.getByRole("heading", { name: "Antrean Tinjauan", exact: true }).waitFor({ timeout: SLOW });
    await h.waitForLoadState("networkidle");
    return norm(await h.locator("main").innerText().catch(() => ""));
  };
  try {
    await magicSignIn(h, people.kaprodi.email);
    // L3: the head of department reviews as Mengelola · SD (HOD-08: Mengajar is their own classes)
    await keKonteks(h, { tujuan: "MENGELOLA" });
  } catch (e) {
    hasil.gagal = `the head of department could not sign in: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  return {
    hasil,
    async fase(f) {
      if (hasil.gagal) return;
      try {
        const teks = await buka();
        // Batch 3 (W1.7): the queue's rows are whole-row links, named by the title and then its line of facts
        const tautan = h.getByRole("link", { name: new RegExp(`^${judul.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
        const menunggu = Number(sql(`select count(*) from public.courses where institution_id='${ids.sd}' and status='IN_REVIEW'`));
        const r = { menunggu, kosong: /Tidak ada yang menunggu tinjauan Anda/.test(teks), terdaftar: (await tautan.count()) > 0 };
        rec_shots_kaprodi.push(await shot(h, `j4-4-antrean-${f}`));
        if (f === "diajukan" && r.terdaftar) {
          await tautan.first().click();
          await h.waitForURL((u) => u.pathname === `/studio/paket/${course}`, { timeout: SLOW });
          // a click is a client-side move: the address changes while Studio still says «Memuat halaman…», and the
          // load state was reached long before, so the package page is read once its own step list is on screen
          await h.getByRole("heading", { name: "Langkah menuju terbit", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
          r.dibuka = new URL(h.url()).pathname;
          r.setujui = (await h.getByRole("button", { name: "Setujui isi", exact: true }).count()) > 0;
          rec_shots_kaprodi.push(await shot(h, "j4-4-dibuka-dari-antrean"));
        }
        hasil[f] = r;
      } catch (e) {
        hasil[f] = { gagal: String(e.message ?? e).split("\n")[0].slice(0, 160) };
      }
    },
    halaman: () => (hasil.gagal ? null : h),
    async tutup() { await hc.close(); },
  };
}
const rec_shots_kaprodi = [];

await step("S17", "Studio to Terbit with two people: Bab 1 through the seven steps; the head of department reviews, reading every question, key and reason before approving, then makes and locks the release; Gladys publishes (DAISY-06, BOB-03, D-088(h), HOD-04, HOD-05, GS-09)", async (rec) => {
  const course = babSatu();
  if (!course) { rec.verdict = "BLOCKED"; return "S15c left no Bab 1 course"; }
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  if (!(await g.getByRole("button", { name: TERBIT[0][1] }).count()) && !/Langkah menuju terbit/i.test(await bodyText(g))) {
    rec.verdict = "NOTE"; return `this candidate has no Langkah menuju terbit on the package page (state ${keadaanBab(course)})`;
  }
  const notes = [`start ${keadaanBab(course)}`];
  const kaprodi = await lihatAntreanKaprodi(course);
  antreanKaprodi = kaprodi.hasil;
  // HOD-04, GS-09: the head of department reviews (reading every question first), makes and locks the release
  const jadi = await terbitkanLewatLayar(course, rec, notes, { bacaSoal: true, antrean: kaprodi.fase, peninjau: kaprodi.halaman(), tanpaLemah: true });
  await kaprodi.tutup();
  if (!jadi) return notes.join("; ");
  terbitBab = keadaanBab(course).endsWith("|PUBLISHED");
  const tests = sql(`select coalesce(string_agg(mode::text, ',' order by mode::text), '-') from public.assessment_definitions where course_id='${course}'`).trim();
  notes.push(`published: ${terbitBab}; its tests: ${tests}`);
  if (!terbitBab) rec.verdict = "FAIL";
  return notes.join("; ");
});

await step("S17t", "the head of department's review queue (Studio → «Antrean Tinjauan»): before Bab 1 is sent it says nothing waits; once sent it lists Bab 1, which opens on its package page with «Setujui isi» offered (J4.4, HOD-03)", async (rec) => {
  rec.shots.push(...rec_shots_kaprodi);
  const k = antreanKaprodi;
  if (!k || k.gagal || !k.sebelum || !k.diajukan) { rec.verdict = "BLOCKED"; return k?.gagal ?? "S17 did not reach the review step"; }
  // the empty line is said exactly when nothing of the school waits (another chapter may honestly be waiting)
  const ok = !k.sebelum.gagal && !k.diajukan.gagal && k.sebelum.kosong === (k.sebelum.menunggu === 0) && !k.sebelum.terdaftar
    && k.diajukan.terdaftar && !k.diajukan.kosong && k.diajukan.setujui === true;
  if (!ok) rec.verdict = "FAIL";
  return `before Bab 1 was sent: ${JSON.stringify(k.sebelum)}; once sent: ${JSON.stringify(k.diajukan)}`;
});

// D-088(b), BOB-49 / DAISY-38: before the school has set Bab 1's pass mark the teacher reads «Batas ketuntasan belum
// ditetapkan» on Siapkan and Sediakan is refused, saying who sets it; the school admin then sets 60% on Konfigurasi →
// Batas ketuntasan, by clicking, with a reason, and the page reads it back with its history.
await step("S17b", "before the pass mark is set the teacher reads «Batas ketuntasan belum ditetapkan» and Sediakan is refused; the school admin sets Bab 1's pass mark on Konfigurasi → Batas ketuntasan (D-088(b), BOB-49, DAISY-38)", async (rec) => {
  if (!terbitBab) { rec.verdict = "BLOCKED"; return "S17 did not publish Bab 1"; }
  const course = babSatu();
  const kelas = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1A' and is_active limit 1`).trim();
  const catatan = [];
  // the teacher, first
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru.email);
  await t.goto(`${APP}/mengajar/${kelas}/siapkan`, { waitUntil: "networkidle" });
  await tutupTur(t);
  const row = t.locator("a.pin-row").filter({ hasText: "Matematika Kelas 5" }).first();
  if (!(await row.count())) { rec.verdict = "FAIL"; await tc.close(); return `Siapkan does not offer Bab 1; page: ${(await bodyText(t)).slice(0, 260)}`; }
  await row.click();
  await t.waitForLoadState("networkidle");
  const belum = norm(await t.locator(".pin-batas").first().innerText().catch(() => ""));
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + 30 * 86400000));
  await t.locator("#pin-sampai").fill(sampai).catch(() => {});
  rec.shots.push(await shot(t, "ketuntasan-belum-guru"));
  await t.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await t.waitForLoadState("networkidle");
  await t.waitForTimeout(1000);
  const kode = new URL(t.url()).searchParams.get("kode");
  const tolak = norm(await bodyText(t));
  rec.shots.push(await shot(t, "ketuntasan-ditolak-guru"));
  await tc.close();
  const la0 = Number(sql(`select count(*) from public.learning_assignments where course_id='${course}'`).trim());
  const tolakOk = /Batas ketuntasan belum ditetapkan/.test(belum) && kode === "ASSIGN_PASS_MARK_MISSING"
    && /Batas ketuntasan pelajaran ini belum ditetapkan/.test(tolak) && /Konfigurasi/.test(tolak) && la0 === 0;
  if (!tolakOk) rec.verdict = "FAIL";
  catatan.push(`teacher before the mark: Siapkan reads "${belum.slice(0, 160)}"; «Sediakan» → kode=${kode}, the page names the pass mark ${/Batas ketuntasan pelajaran ini belum ditetapkan/.test(tolak)} and Konfigurasi ${/Konfigurasi/.test(tolak)}; learning assignments made ${la0}`);

  // the school admin sets it, by clicking
  await a.goto(`${APP}/konfigurasi/ketuntasan?sekolah=${ids.sd}#ketuntasan`, { waitUntil: "networkidle" });
  await tutupTur(a);
  const baris = a.locator(`#ketuntasan li[data-pelajaran="${course}"]`);
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "ketuntasan-admin"));
    return `${catatan.join("; ")}; Konfigurasi lists no Bab 1 under Batas ketuntasan: ${norm(await a.locator("#ketuntasan").innerText().catch(() => "")).slice(0, 300)}`;
  }
  const sebelum = norm(await baris.innerText());
  // B1: a record's one action opens its short form in place first
  await baris.locator("[data-buka-ubah]").click();
  await baris.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await baris.locator('input[name="persen"]').fill("60");
  await baris.locator('input[name="alasan"]').fill("Keputusan rapat guru");
  await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW });
  await a.waitForLoadState("networkidle");
  rec.shots.push(await shot(a, "ketuntasan-ditetapkan"));
  const hasil = norm(await a.locator("#ketuntasan").innerText());
  const sesudah = norm(await a.locator(`#ketuntasan li[data-pelajaran="${course}"]`).innerText());
  const db = sql(`select m.percent || '|' || p.display_name || '|' || m.reason || '|' ||
      (select count(*) from public.audit_log l where l.action = 'school_pass_mark.set' and l.target_id = m.id::text)
    from public.school_pass_marks m join public.persons p on p.id = m.set_by_person_id
   where m.institution_id='${ids.sd}' and m.course_id='${course}'
     and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`).trim();
  const [persen, oleh, alasan, audit] = db.split("|");
  const setOk = /Batas ketuntasan belum ditetapkan/.test(sebelum) && /Batas ketuntasan ditetapkan/.test(hasil)
    && /Batas ketuntasan: 60%/.test(sesudah) && persen === "60" && alasan === "Keputusan rapat guru" && audit === "1";
  if (!setOk) rec.verdict = "FAIL";
  catatan.push(`admin: Bab 1's row read "${sebelum.slice(0, 120)}" → «Tetapkan» 60 → the section says ${/Batas ketuntasan ditetapkan/.test(hasil)}, the row "${sesudah.slice(0, 160)}"; in the database ${persen}% set by ${oleh} ("${alasan}"), audited ${audit}`);
  return catatan.join("; ");
});

await step("S18", "the teacher assigns the published Bab 1 to Kelas 1A (Siapkan → Sediakan, BOB-04)", async (rec) => {
  if (!terbitBab) { rec.verdict = "BLOCKED"; return "S17 did not publish Bab 1"; }
  const course = babSatu();
  const kelas = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1A' and is_active limit 1`).trim();
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru.email);
  await t.goto(`${APP}/mengajar/${kelas}/siapkan`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(t, "siapkan-pilih"));
  const row = t.locator("a.pin-row").filter({ hasText: "Matematika Kelas 5" }).first();
  if (!(await row.count())) { rec.verdict = "FAIL"; return `Siapkan does not offer Bab 1; page: ${(await bodyText(t)).slice(0, 260)}`; }
  await row.click();
  await t.waitForLoadState("networkidle");
  // the school's calendar (Asia/Jakarta): the teacher's "until" is a day on it
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + 30 * 86400000));
  await t.locator("#pin-sampai").fill(sampai).catch(() => {});
  // D-088(b): the lesson's mark, read-only, as the school set it (S17b)
  const batas = norm(await t.locator(".pin-batas").first().innerText().catch(() => ""));
  if (!/Batas ketuntasan: 60%/.test(batas)) rec.verdict = "FAIL";
  rec.shots.push(await shot(t, "siapkan-tinjau"));
  await t.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await t.waitForLoadState("networkidle");
  await t.waitForTimeout(1500);
  rec.shots.push(await shot(t, "siapkan-hasil"));
  const u = new URL(t.url());
  const la = sql(`select count(*) from public.learning_assignments where course_id='${course}'`).trim();
  const aa = sql(`select coalesce(string_agg(d.mode::text || ':' || aa.status::text, ',' order by d.mode::text), '-')
    from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id where d.course_id='${course}'`).trim();
  if (Number(la) < 1 || !/PRE_TEST/.test(aa) || !/POST_TEST/.test(aa)) rec.verdict = "FAIL";
  // M10: "from" (today, the form's default) and "until" are days on the school's calendar,
  // so the window is 00:00 of the first to 23:59:59 of the last, Jakarta time, at any hour
  // the audit happens to run
  const jendela = sql(`select to_char(available_from at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS') || ' .. ' ||
      coalesce(to_char(available_until at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS'), '-') || '|' ||
      (available_from = ((now() at time zone 'Asia/Jakarta')::date::timestamp at time zone 'Asia/Jakarta'))::text || '|' ||
      coalesce((available_until = ((date '${sampai}' + time '23:59:59') at time zone 'Asia/Jakarta'))::text, 'false')
    from public.learning_assignments where course_id='${course}' order by created_at desc limit 1`).trim();
  const [win, dariOk, sampaiOk] = jendela.split("|");
  if (dariOk !== "true" || sampaiOk !== "true") rec.verdict = "FAIL";
  await tc.close();
  const segel = sql(`select coalesce(string_agg(d.mode::text || ':' || coalesce(aa.pass_mark::text, '-') || ':' || coalesce(aa.pass_mark_source, '-'), ',' order by d.mode::text), '-')
    from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id where d.course_id='${course}'`).trim();
  if (!/POST_TEST:0\.60:SCHOOL/.test(segel) || !/PRE_TEST:-:-/.test(segel)) rec.verdict = "FAIL";
  return `Siapkan read "${batas}"; sealed ${segel}; after Sediakan: ${u.pathname}${u.searchParams.get("kode") ? ` kode=${u.searchParams.get("kode")}` : ""}; learning assignments ${la}; assessment assignments ${aa}; window in Jakarta time ${win} (asked: today .. ${sampai}; starts at the school's midnight: ${dariOk}; ends at 23:59:59 of ${sampai}: ${sampaiOk})`;
});

await step("S19", "the student finds Bab 1 and reaches its pre-test (B4)", async (rec) => {
  if (!card || !terbitBab) { rec.verdict = "BLOCKED"; return !card ? "no card" : "Bab 1 was not published"; }
  const sc = await ctx();
  const s = await sc.newPage();
  await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await s.locator("#kartu").fill(card.number);
  await s.locator("#pin").fill(card.pin);
  await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await s.waitForTimeout(4000);
  await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(s, "murid-belajar-bab1"));
  const home = await bodyText(s);
  const tugas = sql(`select id from public.learning_assignments where course_id='${babSatu()}' order by created_at desc limit 1`).trim();
  const listed = /Matematika Kelas 5|Pola Bilangan/.test(home);
  const href = tugas ? await s.locator(`a[href^="/belajar/${tugas}"]`).first().getAttribute("href").catch(() => null) : null;
  if (!tugas || !listed || !href) { rec.verdict = "FAIL"; await sc.close(); return `Bab 1 on /belajar: named ${listed}, linked ${Boolean(href)}; page: ${home.slice(0, 260)}`; }
  const res = await s.goto(`${APP}/belajar/${tugas}/pemetaan`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(s, "murid-pemetaan"));
  const txt = await bodyText(s);
  const notFound = res?.status() === 404 || /Halaman ini tidak ada/.test(txt);
  // the one refusal page ("belum tersedia untuk akun Anda") is not the pre-test either
  const refused = /belum tersedia untuk akun Anda/.test(txt);
  const bukaSejak = sql(`select to_char(available_from at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') || ' Jakarta; now ' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
    from public.learning_assignments where id='${tugas}'`).trim();
  if (notFound || refused) rec.verdict = "FAIL";
  await sc.close();
  return `/belajar offers ${href}; /belajar/${tugas}/pemetaan → HTTP ${res?.status()}${refused ? " (the refusal page)" : ""}; open from ${bukaSejak}: ${txt.slice(0, 200)}`;
});

// ───────────────────────────── D-064: class figures from official evidence, in a real school
// Five students of Kelas 1A take Bab 1's pre-test and post-test to a plan (how many they get right),
// so every figure the teacher and the head of department then read has a value known in advance.
// SD Zayd is a real school (is_synthetic false) on a stack in production posture, so these sessions
// are OFFICIAL evidence, the only kind a class figure counts. Staging's school is synthetic and can
// never show them (staging report, D3); D-064 moves this proof here. The students follow the staging
// journey's plan and helpers (audit/staging/journey.mjs, J07–J14). They open each test by its address:
// reaching the tests by clicking is proven on staging (J08, J10, J11), and this proof is the figures.
async function tutupTur(page) {
  const kartuTur = page.locator('.pin-tur-kartu[role="dialog"]');
  if (!(await kartuTur.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false))) return false;
  await kartuTur.locator("button.pin-tur-x").last().click();
  await kartuTur.waitFor({ state: "detached", timeout: SLOW });
  return true;
}
// the answer key and the test sizes, from the chapter S15c imported
const KUNCI = new Map();
const SOAL = { pre: 0, post: 0 };
{
  const f = new URL("./fixtures/sd5-sintetis-bab1.paket.json", import.meta.url);
  if (existsSync(f)) {
    for (const c of JSON.parse(readFileSync(f, "utf8")).courses)
      for (const m of c.modules) for (const l of m.lessons) for (const it of l.items ?? []) {
        KUNCI.set(norm(it.stem), { right: new Set(it.options.filter((o) => o.is_correct).map((o) => norm(o.body))),
                                   wrong: new Set(it.options.filter((o) => !o.is_correct).map((o) => norm(o.body))) });
        if (it.use === "PRE_TEST") SOAL.pre++;
        if (it.use === "POST_TEST") SOAL.post++;
      }
  }
}
// how many each student gets right: the staging journey's plan, so the two proofs read side by side
const RENCANA = [[0.5, 0.875], [0.25, 0.75], [0, 0.625], [0.75, 1], [0.5, 0.5]]
  .map(([p, q]) => ({ pre: Math.round(p * SOAL.pre), post: Math.round(q * SOAL.post) }));
const MURID = ["Ani Murid", "Budi Murid", "Citra Murid", "Dodi Murid", "Eka Murid"];
// what the figures must then say: comprehension is the mean post-test mastery; net gain the mean of
// post minus pre over the students with both (calc_class_comprehension, calc_class_net_gain)
const HARAP = SOAL.pre && SOAL.post ? {
  paham: RENCANA.reduce((n, r) => n + r.post / SOAL.post, 0) / RENCANA.length,
  naik: RENCANA.reduce((n, r) => n + r.post / SOAL.post - r.pre / SOAL.pre, 0) / RENCANA.length,
} : null;
const persen = (v) => new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 0 }).format(v);
const kelasSatuA = () => sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1A' and is_active limit 1`).trim();
const tugasBab = () => sql(`select id from public.learning_assignments where course_id='${babSatu()}' order by created_at desc limit 1`).trim();

// W3: the post-test's «Kumpulkan» asks first and the question's own «Kumpulkan» hands in (the staging journey's `jawabTanya`).
async function jawabTanya(page) {
  const tanya = page.locator('[aria-labelledby="kumpulkan-tanya"]');
  const sampai = await Promise.race([
    tanya.waitFor({ state: "visible", timeout: SLOW }).then(() => "tanya", () => null),
    page.waitForURL((u) => u.pathname.endsWith("/hasil") || u.pathname === "/belajar", { timeout: SLOW }).then(() => "hasil", () => null),
  ]);
  if (sampai !== "tanya") return false;
  await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
  return true;
}
// Answer every question, `right` of them correctly, and finish (the staging journey's `jawab`).
// `simpanTerakhir: false` (W3): the last post-test answer is chosen and «Simpan jawaban ini» is not pressed.
const teksPilihan = (b) => b.locator("span").nth(1).innerText().then(norm);
// `luringDi` (J6.8, STU-09): at that post-test question the network drops before «Simpan jawaban ini» is pressed; the
// page must say it is offline (never that the test is closed), keep the answer on the device and not call it saved;
// when the network returns the answer goes through and reads «Tersimpan». What was seen is returned as `luring`.
// `ubahDi` (STU-07): at that post-test question the student first saves another option, then changes it to the
// planned one and saves again, and reloads the page: it reopens at the next question without a saved answer, and the
// result counts the changed answer. What was seen is returned as `ubah`.
async function jawab(page, mode, right, { simpanTerakhir = true, luringDi = -1, ubahDi = -1 } = {}) {
  const formal = mode === "post";
  let ditanya = null;
  let luring = null;
  let ubah = null;
  const done = [];
  for (let i = 0; i < 40; i++) {
    const stemEl = page.locator("h2.pin-stem").first();
    await stemEl.waitFor({ state: "visible", timeout: SLOW });
    const raw = await stemEl.innerText();
    const k = KUNCI.get(norm(raw));
    const opts = page.locator("ul.pin-opsi button.pin-op");
    const texts = [];
    for (let j = 0; j < await opts.count(); j++) texts.push(await teksPilihan(opts.nth(j)));
    const wantRight = done.filter((d) => d.right).length < right;
    let idx = k ? texts.findIndex((t) => (wantRight ? k.right : k.wrong).has(t)) : -1;
    if (idx < 0) idx = 0;
    await opts.nth(idx).click();
    await page.waitForFunction(([n]) => document.querySelectorAll("ul.pin-opsi button.pin-op")[n]?.getAttribute("aria-pressed") === "true", [idx], { timeout: SLOW });
    const next = page.getByRole("button", { name: "Berikutnya", exact: true });
    const terakhir = (await next.count()) === 0;
    if (formal && i === ubahDi && !terakhir && texts.length > 1) {
      // first another option, saved; then the planned one, saved: the answer is changed
      const lain = idx === 0 ? 1 : 0;
      const simpan = page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ });
      await opts.nth(lain).click();
      await simpan.click();
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
      await opts.nth(idx).click();
      const bisaUbah = (await simpan.count()) > 0;
      await simpan.click();
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
      done.push({ known: Boolean(k), right: Boolean(k) && wantRight && k.right.has(texts[idx]) });
      // a reload in the middle of the test
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: SLOW });
      const sesudah = norm(await page.locator("h2.pin-stem").first().innerText());
      ubah = { bisaUbah, lanjutKeBerikutnya: sesudah !== norm(raw) };
      continue;
    }
    if (formal && i === luringDi && !terakhir) {
      await page.context().setOffline(true);
      await page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ }).click();
      const tanda = page.locator(".pin-luring");
      await tanda.waitFor({ state: "visible", timeout: SLOW }).catch(() => {});
      luring = {
        tanda: norm(await tanda.innerText().catch(() => "")),
        ditutup: (await page.getByText("sudah ditutup").count()) > 0,
        disebutTersimpan: (await page.getByRole("button", { name: "Tersimpan", exact: true }).count()) > 0,
        diPerangkat: await page.evaluate(() => Object.keys(localStorage).filter((x) => x.startsWith("pintar.outbox.")).length),
      };
      await shot(page, "j6-8-luring").catch(() => {});
      await page.context().setOffline(false);
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
      luring.tersimpanLagi = true;
      luring.tandaHilang = (await page.locator(".pin-luring").count()) === 0;
    } else if (formal && !(terakhir && !simpanTerakhir)) {
      await page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ }).click();
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
    } else if (!formal) {
      await page.waitForTimeout(400);
    }
    done.push({ known: Boolean(k), right: Boolean(k) && wantRight && k.right.has(texts[idx]) });
    if (!terakhir) {
      await next.click();
      await page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, raw, { timeout: SLOW });
      continue;
    }
    await page.getByRole("button", { name: formal ? "Kumpulkan" : "Selesaikan pemetaan", exact: true }).click();
    if (formal) ditanya = await jawabTanya(page);
    await page.waitForURL((u) => u.pathname.endsWith(formal ? "/hasil" : "/peta") || u.pathname === "/belajar", { timeout: 60000 });
    break;
  }
  return { answered: done.length, right: done.filter((d) => d.right).length, unknown: done.filter((d) => !d.known).length, ditanya, luring, ubah };
}

const kartuKelas = [];
// ADM-J08: the Pendataan screen, as a school admin uses it with a list copied from a spreadsheet.
async function catatLewatLayar(page, nama, shots, { kelas = "Kelas 1A", peran = "STUDENT" } = {}) {
  const jejak = [];
  await page.goto(`${APP}/pendataan`, { waitUntil: "networkidle" });
  await tutupTur(page);
  await page.locator("#pin-tempel").fill(["nama", ...nama].join("\n"));
  await page.locator("#pin-medan-node_id").waitFor({ timeout: SLOW });
  if (kelas) {
    const tempat = await page.locator("#pin-medan-node_id option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() })));
    const k = tempat.find((o) => o.v.startsWith("t:") && o.t.includes(kelas));
    if (!k) throw new Error(`${kelas} is not offered as a place: ${JSON.stringify(tempat.map((o) => o.t))}`);
    await page.locator("#pin-medan-node_id").selectOption(k.v);
    jejak.push(`pasted ${nama.length} name(s); Tempat «${k.t}» for every row`);
  } else {
    jejak.push(`pasted ${nama.length} name(s); no Tempat`);
  }
  if (peran) await page.locator("#pin-medan-role").selectOption(`t:${peran}`);
  shots.push(await shot(page, "pendataan-petakan"));
  await page.getByRole("button", { name: "Lanjut ke pemeriksaan", exact: true }).click();
  await page.waitForURL((u) => /^\/pendataan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
  await page.getByRole("button", { name: "Periksa daftar ini", exact: true }).click();
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).waitFor({ timeout: SLOW });
  shots.push(await shot(page, "pendataan-pratinjau"));
  jejak.push("«Periksa daftar ini» → the preview");
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).click();
  for (let i = 0; i < 60; i++) {
    await page.waitForLoadState("networkidle");
    const teks = norm(await bodyText(page));
    if (/· Selesai\b/.test(teks)) { jejak.push("«Selesai»"); break; }
    for (const tombol of ["Sudah saya periksa, lanjutkan sisanya", "Mulai mencatat", "Lanjutkan"]) {
      const b = page.getByRole("button", { name: tombol, exact: true });
      if (await b.count() && await b.first().isEnabled()) { await b.first().click(); jejak.push(`«${tombol}»`); break; }
    }
    await page.waitForTimeout(1000);
    if (i % 5 === 4) await page.reload({ waitUntil: "networkidle" });
  }
  shots.push(await shot(page, "pendataan-selesai"));
  return jejak.join(" → ");
}

await step("S20", "the school admin records three more students in Kelas 1A on the Pendataan screen (ADM-J08), then makes the rest of the class's cards in one press, as a printable class set (M7)", async (rec) => {
  if (!card || !adminApi) { rec.verdict = "BLOCKED"; return !card ? "no card for Ani (S10)" : "no school admin session"; }
  kartuKelas.push({ nama: MURID[0], ...card });
  // ADM-J08: the school admin records the three on the Pendataan screen by hand: pastes the list from a
  // spreadsheet, chooses Kelas 1A and Murid for every row, checks, confirms, and waits for «Selesai»
  const log = [await catatLewatLayar(a, MURID.slice(2), (rec.shots))];
  const tercatat = sql(`select count(*) from public.enrollments e join public.persons p on p.id = e.person_id
     join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
    where e.institution_id='${ids.sd}' and m.node_id='${ids.klass}' and p.display_name in (${MURID.slice(2).map((n) => `'${n}'`).join(",")})`).trim();
  if (Number(tercatat) !== 3) { rec.verdict = "FAIL"; return `${log.join(" | ")}; in Kelas 1A afterwards: ${tercatat} of 3`; }
  // M7 (D-085): the rest of Kelas 1A's cards in one press on Aktivasi, read back from the printable class set
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  const pilih = a.locator("section.pin-akt-kelas select");
  if (!(await pilih.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "aktivasi-tanpa-kelas"));
    // diagnosis only: the page's own reads, as the school admin's session, so the cause is named
    const tunggu = await adminApi.rpc("persons_awaiting_account");
    const simpul = await adminApi.from("org_nodes").select("id, name, kind, parent_id, jalur, academic_period_id, is_active").eq("institution_id", ids.sd);
    const anggota = await adminApi.from("memberships").select("node_id, enrollment:enrollments(person_id, status)").eq("node_id", ids.klass).is("valid_to", null);
    const sungguh = sql(`select count(*) from public.memberships m where m.node_id='${ids.klass}' and m.valid_to is null`).trim();
    return `Aktivasi offers no whole-class issue. As the school admin: awaiting ${tunggu.error ? `error ${tunggu.error.message}` : (tunggu.data ?? []).length}` +
      ` (${JSON.stringify((tunggu.data ?? []).map((x) => [x.display_name, x.institution_id === ids.sd]))}); org_nodes ${simpul.error ? `error ${simpul.error.message}` : `${(simpul.data ?? []).length} (${(simpul.data ?? []).map((n) => n.kind).join(",")})`}; ` +
      `Kelas 1A memberships ${anggota.error ? `error ${anggota.error.message}` : JSON.stringify(anggota.data)} (in the database: ${sungguh}); the page: ${(await bodyText(a)).slice(0, 300)}`;
  }
  const opsi = await pilih.locator("option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: o.textContent ?? "" })));
  const kelas1A = opsi.find((o) => o.t.includes("Kelas 1A"));
  if (!kelas1A) { rec.verdict = "FAIL"; return `Kelas 1A is not offered: ${JSON.stringify(opsi.map((o) => o.t))}`; }
  await pilih.selectOption(kelas1A.v);
  await a.getByRole("button", { name: "Buat kartu untuk kelas ini", exact: true }).click();
  await a.locator("section.pin-akt-lembar").waitFor({ timeout: 120000 });
  const set = await a.locator("li.pin-akt-kartu").evaluateAll((ls) => ls.map((l) => ({
    nama: l.querySelector("strong")?.textContent ?? "",
    nilai: [...l.querySelectorAll("dd.pin-num")].map((d) => (d.textContent ?? "").trim()),
  })));
  rec.shots.push(await shot(a, "aktivasi-kartu-kelas"));
  for (const k of set) kartuKelas.push({ nama: k.nama, number: k.nilai[0], pin: k.nilai[1] });
  kartuKelas.sort((x, y) => MURID.indexOf(x.nama) - MURID.indexOf(y.nama)); // S21 gives each card its student's plan
  // printed, the paper carries the set and nothing else
  await a.emulateMedia({ media: "print" });
  const dicetak = { kartu: await a.locator("li.pin-akt-kartu").first().isVisible(), judul: await a.locator("h1").first().isVisible(),
    daftar: await a.locator("ul.pin-akt-daftar").isVisible().catch(() => false) };
  rec.shots.push(await shot(a, "aktivasi-kartu-kelas-cetak"));
  await a.emulateMedia({ media: "screen" });
  const nama = set.map((k) => k.nama).sort();
  const harap = MURID.slice(1).sort();
  const bentuk = set.every((k) => /^\d{10}$/.test(k.nilai[0] ?? "") && /^\d{6}$/.test(k.nilai[1] ?? ""));
  const enrolled = sql(`select count(distinct e.person_id) from public.memberships m join public.enrollments e on e.id = m.enrollment_id where m.node_id='${ids.klass}' and m.valid_to is null`).trim();
  if (kartuKelas.length < MURID.length || JSON.stringify(nama) !== JSON.stringify(harap) || !bentuk || !dicetak.kartu || dicetak.judul || dicetak.daftar) rec.verdict = "FAIL";
  return `enrolled in Kelas 1A: ${enrolled}; one press on «Buat kartu untuk kelas ini» made ${set.length} card(s) for ${JSON.stringify(nama)} (expected ${JSON.stringify(harap)}; Ani has hers from S10); ` +
    `every card a 10-digit number and a 6-digit PIN: ${bentuk}; printed: cards ${dicetak.kartu}, page title ${dicetak.judul}, the list ${dicetak.daftar}; ` +
    `class cards: ${kartuKelas.length} of ${MURID.length} (numbers and PINs not recorded)${log.length ? `; ${log.join("; ")}` : ""}`;
});

// EDU-J23/J24: the teacher, from «Lihat bukti», follows the Uji Penguasaan's «Lihat nama murid» to /siapa and reads the three lists.
let siapaTengah = null;
async function bacaSiapa() {
  const kelas = kelasSatuA();
  const post = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
     where d.course_id='${babSatu()}' and d.mode='POST_TEST' and aa.node_id='${kelas}' order by aa.created_at desc limit 1`).trim();
  const tc = await ctx();
  const t = await tc.newPage();
  try {
    await magicSignIn(t, people.guru.email);
    await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
    await tutupTur(t);
    const tautan = t.locator(`a[href="/mengajar/${kelas}/siapa?penugasan=${post}"]`);
    if (!(await tautan.count())) return { gagal: `no «Lihat nama murid» for the Uji Penguasaan on «Lihat bukti»: ${norm(await bodyText(t)).slice(0, 300)}` };
    await tautan.first().click();
    await t.waitForURL((u) => u.pathname.endsWith("/siapa"), { timeout: SLOW });
    await t.locator("h1").first().waitFor({ timeout: SLOW });
    const shotPath = await shot(t, "edu23-siapa-tengah");
    // W3.5 (Batch 4; Daisy, J2Kelas): one Table, each learner once with their state's Badge; the three lists are read back
    // from it, grouped by the Badge's words (the same words the three headings had)
    const baris = await t.locator("#pin-siapa-murid tbody tr:not(.pin-tabel-kosong)").evaluateAll((trs) => trs.map((tr) => ({
      nama: (tr.querySelector('th[scope="row"]')?.textContent ?? "").replace(/\s+/g, " ").trim(),
      keadaan: (tr.querySelector("[data-keadaan]")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
    const daftar = ["Sudah mengumpulkan", "Sudah mulai, belum mengumpulkan", "Belum mengerjakan"].map((judul) => ({
      judul, nama: baris.filter((b) => b.keadaan === judul).map((b) => b.nama).join(" "),
    }));
    return { daftar, shotPath };
  } finally {
    await tc.close();
  }
}

await step("S21", "five students take Bab 1's pre-test and post-test to plan; student 2 changes the first post-test answer and reloads mid-test (STU-07); student 3 loses the network at the second post-test question and is told so, the answer kept and sent when it returns (J6.8); student 4 chooses the last post-test answer, does not press «Simpan jawaban ini», and hands in (W3); each result page says what was answered and whether the school's target was met (M3, W4)", async (rec) => {
  if (!terbitBab || !HARAP) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "the chapter fixture is absent"; }
  if (kartuKelas.length < MURID.length) { rec.verdict = "BLOCKED"; return `only ${kartuKelas.length} class cards (S20)`; }
  const tugas = tugasBab();
  const out = [];
  for (let i = 0; i < MURID.length; i++) {
    const k = kartuKelas[i];
    const plan = RENCANA[i];
    const sc = await ctx();
    const s = await sc.newPage();
    try {
      await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
      await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
      await s.locator("#kartu").fill(k.number);
      await s.locator("#pin").fill(k.pin);
      await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
      await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
      await s.goto(`${APP}/belajar/${tugas}/pemetaan`, { waitUntil: "networkidle" });
      await tutupTur(s);
      await s.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
      const pre = await jawab(s, "pre", plan.pre);
      await s.goto(`${APP}/belajar/${tugas}/penguasaan`, { waitUntil: "networkidle" });
      await tutupTur(s);
      await s.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
      if (i === 0) {
        // EDU-J23/J24: the first student has the Uji Penguasaan open and has not handed it in; the teacher looks now (S21b)
        await s.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: SLOW }).catch(() => {});
        siapaTengah = await bacaSiapa().catch((e) => ({ gagal: String(e.message ?? e).split("\n")[0].slice(0, 160) }));
      }
      const w3 = i === 3; // all right by plan: an unsaved last answer that is dropped shows as one fewer
      const j68 = i === 2; // J6.8: the network drops at the second post-test question and returns
      const s07 = i === 1; // STU-07: the first post-test answer is changed, then the page is reloaded
      const post = await jawab(s, "post", plan.post, { simpanTerakhir: !w3, luringDi: j68 ? 1 : -1, ubahDi: s07 ? 0 : -1 });
      if (s07) {
        const u = post.ubah;
        const ubahOk = !!u && u.bisaUbah && u.lanjutKeBerikutnya;
        if (!ubahOk) rec.verdict = "FAIL";
        out.push(`STU-07 ${k.nama} changed the first answer and reloaded: ${JSON.stringify(u)}${ubahOk ? "" : " MISMATCH"}`);
      }
      if (j68) {
        const l = post.luring;
        const luringOk = !!l && /Sedang luring/.test(l.tanda) && !l.ditutup && !l.disebutTersimpan && l.diPerangkat > 0 && l.tersimpanLagi && l.tandaHilang;
        if (!luringOk) rec.verdict = "FAIL";
        out.push(`J6.8 ${k.nama} offline at question 2: ${JSON.stringify(l)}${luringOk ? "" : " MISMATCH"}`);
      }
      await s.locator("h1").first().waitFor({ timeout: SLOW });
      const t = await bodyText(s);
      const m = t.match(/Terjawab tepat (\d+) dari (\d+) soal/);
      // D-085 M3 (W4): the page says whether the target was met; the expectation is the attempt's own seal and result
      const putusan = sql(`select (r.safety_gate_passed and r.mastery >= s.pass_mark)::text || '|' || s.pass_mark
        from public.assessment_sessions s join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
        join public.persons p on p.id = s.person_id
       where s.learning_assignment_id = '${tugas}' and s.mode = 'POST_TEST' and p.display_name = '${k.nama}'
       order by s.created_at desc limit 1`).trim();
      const [lulus, batas] = putusan.split("|");
      const harapTarget = lulus === "true" ? "Target tercapai." : "Belum mencapai target.";
      const targetOk = t.includes(harapTarget) && batas === "0.60" && (plan.post / SOAL.post >= 0.6 || lulus === "false")
        && (lulus === "true" || await s.locator("#ulang a[href*='/pelajaran/']").count() > 0);
      const ok = m && Number(m[1]) === plan.post && Number(m[2]) === SOAL.post && !pre.unknown && !post.unknown && targetOk;
      if (!ok) rec.verdict = "FAIL";
      if (i === 0 || w3) rec.shots.push(await shot(s, `d064-murid${i + 1}-hasil`));
      out.push(`${k.nama}: pre ${pre.right}/${pre.answered}, post ${post.right}/${post.answered}${w3 ? " (the last answer chosen, not saved)" : ""}; «Kumpulkan» ${post.ditanya ? "asked first" : "handed in at once"}; the page says "${m?.[0] ?? "no 'Terjawab tepat' line"}" and "${harapTarget}" ${t.includes(harapTarget)} (sealed ${batas}, lulus ${lulus})${ok ? "" : w3 ? " MISMATCH: the unsaved answer was lost at «Kumpulkan» (W3)" : " MISMATCH"}`);
    } catch (e) {
      rec.verdict = "FAIL";
      rec.shots.push(await shot(s, `d064-murid${i + 1}-berhenti`));
      out.push(`${k.nama}: stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`);
    }
    await sc.close();
  }
  const kelas = sql(`select coalesce(string_agg(x, ', ' order by x), 'none') from (
      select s.mode::text || ' ' || public.effective_evidence_class(s.id)::text || ' ' || s.status::text || ' x' || count(*) x
        from public.assessment_sessions s where s.learning_assignment_id='${tugas}'
       group by s.mode, public.effective_evidence_class(s.id), s.status) q`).trim();
  const resmi = Number(sql(`select count(*) from public.assessment_sessions s where s.learning_assignment_id='${tugas}'
      and s.mode='POST_TEST' and s.status='FINALIZED' and public.effective_evidence_class(s.id)='OFFICIAL'`).trim());
  if (resmi < MURID.length) rec.verdict = "FAIL";
  return `${out.join("; ")} | this assignment's sessions: ${kelas}`;
});

await step("S21b", "while the first student has the Uji Penguasaan open, the teacher follows «Lihat nama murid» from «Lihat bukti» and reads who handed in, who started and who has not (EDU-J23, EDU-J24)", async (rec) => {
  if (!siapaTengah) { rec.verdict = "BLOCKED"; return "the first student did not reach the Uji Penguasaan (S21)"; }
  if (siapaTengah.gagal) { rec.verdict = "FAIL"; return siapaTengah.gagal; }
  rec.shots.push(siapaTengah.shotPath);
  const [sudah, sedang, belum] = ["Sudah mengumpulkan", "Sudah mulai, belum mengumpulkan", "Belum mengerjakan"]
    .map((h) => siapaTengah.daftar.find((d) => d.judul.startsWith(h))?.nama ?? null);
  const di = (teks, n) => (teks ?? "").includes(n);
  const ok = sedang !== null && belum !== null && sudah !== null
    && di(sedang, MURID[0]) && !di(belum, MURID[0]) && !di(sudah, MURID[0])
    && MURID.slice(1).every((n) => di(belum, n) && !di(sedang, n) && !di(sudah, n));
  if (!ok) rec.verdict = "FAIL";
  return `handed in: "${sudah ?? "no such list"}"; started, not handed in: "${sedang ?? "no such list"}"; not attempted: "${belum ?? "no such list"}"` +
    `${ok ? "" : ` (expected ${MURID[0]} started, ${MURID.slice(1).join(", ")} not attempted)`}`;
});

let lintasPerangkat = null; // S21c → S21e: the lesson Ani left, and the page she left it on
// STU-J16, STU-J17, STU-J18 (W2): one computer, two students. Ani opens Bab 1's first lesson from the
// reading map, turns to its second page, and signs out with «Keluar»; Budi signs in on the same browser
// with his card. /belajar greets Budi and no longer opens for Ani, and the same lesson opens for Budi at
// its first page, not where Ani left it.
await step("S21c", "one computer, two students: the first reads a lesson to its second page and signs out with «Keluar»; the next signs in on the same browser and finds his own home and the lesson at its first page (STU-J16, STU-J17, STU-J18, W2)", async (rec) => {
  if (!terbitBab || kartuKelas.length < 2) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "fewer than two class cards (S20)"; }
  const tugas = tugasBab();
  const sc = await ctx();
  const s = await sc.newPage();
  const masukKartu = async (k) => {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.waitForLoadState("networkidle");
  };
  const posisi = async () => norm(await s.locator("p.pin-lpos").first().innerText().catch(() => ""));
  try {
    // Ani: the reading map → the first lesson → its second page
    await masukKartu(kartuKelas[0]);
    await s.goto(`${APP}/belajar/${tugas}/peta`, { waitUntil: "networkidle" });
    await tutupTur(s);
    await s.getByRole("link", { name: "Buka pelajarannya" }).first().click();
    await s.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const pelajaran = new URL(s.url()).pathname;
    const awal = await posisi();
    const lanjut = s.getByRole("button", { name: "Halaman berikutnya", exact: true });
    if (!(await lanjut.isEnabled().catch(() => false))) { rec.verdict = "NOTE"; await sc.close(); return `the first lesson has one page (${awal}); nothing to carry over`; }
    await lanjut.click();
    await s.waitForFunction((prev) => document.querySelector("p.pin-lpos")?.innerText.replace(/\s+/g, " ").trim() !== prev, awal, { timeout: SLOW });
    const ani = await posisi();
    await s.waitForTimeout(1500); // the page reached is saved on view
    lintasPerangkat = { pelajaran, ani, awal };
    rec.shots.push(await shot(s, "stu-j16-ani-halaman-2"));
    // «Keluar» from the strip
    await s.getByRole("button", { name: "Keluar", exact: true }).first().click();
    await s.waitForURL((u) => !u.pathname.startsWith("/belajar"), { timeout: SLOW });
    await s.waitForLoadState("networkidle");
    const sesudahKeluar = new URL(s.url()).pathname;
    // STU-19: the browser's Back after «Keluar» does not resume Ani's page
    await s.goBack({ waitUntil: "networkidle" }).catch(() => null);
    await s.reload({ waitUntil: "networkidle" }).catch(() => null);
    const kembali = new URL(s.url()).pathname;
    const kembaliTerkunci = !kembali.startsWith("/belajar") || !(await bodyText(s)).includes("Ani");
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    const terkunci = kembaliTerkunci && (!new URL(s.url()).pathname.startsWith("/belajar") || !(await bodyText(s)).includes("Ani"));
    // Budi, on the same browser
    await masukKartu(kartuKelas[1]);
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const rumah = await bodyText(s);
    const sapa = /Halo, Budi/.test(rumah) && !/\bAni\b/.test(rumah);
    rec.shots.push(await shot(s, "stu-j17-budi-belajar"));
    await s.goto(`${APP}${pelajaran}`, { waitUntil: "networkidle" });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const budi = await posisi();
    rec.shots.push(await shot(s, "stu-j18-budi-pelajaran"));
    if (ani === awal || !terkunci || !sapa || budi !== awal) rec.verdict = "FAIL";
    await sc.close();
    return `Ani turned the first lesson from "${awal}" to "${ani}"; «Keluar» → ${sesudahKeluar}; Back and refresh → ${kembali} (not Ani's: ${kembaliTerkunci}); /belajar afterwards no longer Ani's: ${terkunci}; ` +
      `Budi signed in on the same browser: greeted as Budi with no Ani on the page: ${sapa}; the same lesson opens for Budi at "${budi}" (expected "${awal}")`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "stu-j16-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});

// STU-J22, X-15-STU: after the last result, the student follows «Apa berikutnya» from the result page
// and reads what PINTAR offers next: a certificate, other open work, or the honest end
// («Tidak ada lagi yang menunggu»). Never clicked before.
await step("S21d", "after the Uji Penguasaan's result, the student follows «Apa berikutnya» and reads what comes next; below target she is told so and where to review, and her chapter card says it (STU-J22, X-15-STU, M3, W4)", async (rec) => {
  if (!terbitBab || kartuKelas.length < MURID.length) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "class cards missing (S20)"; }
  const tugas = tugasBab();
  const k = kartuKelas[MURID.length - 1];
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}/belajar/${tugas}/hasil`, { waitUntil: "networkidle" });
    await tutupTur(s);
    await s.getByRole("link", { name: /Apa berikutnya/ }).first().click();
    await s.waitForURL((u) => u.pathname === `/belajar/${tugas}/lanjut`, { timeout: SLOW });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const h1 = norm(await s.locator("h1").first().innerText());
    const teks = norm(await s.locator("main").innerText().catch(() => ""));
    const baris = await s.locator(".pin-next .pin-nrow").count();
    // the headings render in capitals (text-transform), so read them case-insensitively
    const habis = /Tidak ada lagi yang menunggu/i.test(teks);
    const sertifikat = /Lihat sertifikat/i.test(teks);
    rec.shots.push(await shot(s, "stu-j22-apa-berikutnya"));
    // the page offers a way on, or says honestly that nothing is waiting; it never leaves the student with neither
    if (h1 !== "Apa berikutnya" || (baris === 0 && !habis)) rec.verdict = "FAIL";
    // D-085 M3 (W4): this student is below the target (4 of 8, the school's mark 60%): never told only that all is done,
    // and her home's chapter card says the chapter is finished and the target not reached
    const belumTarget = /Belum mencapai target/.test(teks) && (await s.locator('a[href$="/hasil#ulang"]').count()) > 0;
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const kartu = norm(await s.locator('[data-tur="daftar"] .pin-tstatus').first().innerText().catch(() => ""));
    rec.shots.push(await shot(s, "m3-kartu-belum-target"));
    if (!belumTarget || !/Selesai · belum mencapai target/.test(kartu)) rec.verdict = "FAIL";
    await sc.close();
    return `${k.nama} followed «Apa berikutnya» from the result: "${h1}"; ${baris} thing(s) offered${sertifikat ? " (a certificate among them)" : ""}; ` +
      `the honest end shown ${habis}; below target said with the way to review: ${belumTarget}; her home's card reads "${kartu}"; the page says: "${teks.slice(0, 260)}"`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "stu-j22-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});

// STU-J19: the same student on another device. Ani, who left Bab 1's first lesson on its second page on the
// shared computer (S21c), signs in on a different browser with her card and opens the lesson: it continues
// where she left it, from what the server recorded, not from the first page.
await step("S21e", "the same student on another device: Ani signs in on a different browser and the lesson continues where she left it (STU-J19)", async (rec) => {
  if (!lintasPerangkat || !kartuKelas[0]) { rec.verdict = "BLOCKED"; return "S21c did not leave a lesson part-read"; }
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(kartuKelas[0].number);
    await s.locator("#pin").fill(kartuKelas[0].pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}${lintasPerangkat.pelajaran}`, { waitUntil: "networkidle" });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const di = norm(await s.locator("p.pin-lpos").first().innerText().catch(() => ""));
    rec.shots.push(await shot(s, "stu-j19-perangkat-lain"));
    if (di !== lintasPerangkat.ani) rec.verdict = "FAIL";
    await sc.close();
    return `on a second browser Ani's lesson opens at "${di}" (left at "${lintasPerangkat.ani}" on the shared computer; the first page is "${lintasPerangkat.awal}")`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "stu-j19-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});

// D-084 J6.13 (STU-18): a student whose only chapter is finished, at the target, with nothing else waiting. The home
// says so where the next step would stand, and does not say that something is under way today.
await step("S21f", "a student with every chapter finished and nothing else waiting: Budi's home says «Tidak ada lagi yang menunggu» and where new work will appear, never «Ini yang sedang berjalan hari ini.» (J6.13, STU-18)", async (rec) => {
  if (!terbitBab || !kartuKelas[1]) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "class cards missing (S20)"; }
  const k = kartuKelas[1];
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const habis = norm(await s.locator("#pin-habis").innerText().catch(() => ""));
    const kepala = norm(await s.locator(".pin-head").first().innerText().catch(() => ""));
    const panel = await s.locator("section.pin-lanjut").count();
    const kartu = norm(await s.locator('[data-tur="daftar"] .pin-tstatus').first().innerText().catch(() => ""));
    rec.shots.push(await shot(s, "j6-13-tidak-ada-lagi"));
    const ok = /Tidak ada lagi yang menunggu/i.test(habis) && /akan muncul di halaman Belajar/.test(habis)
      && !/sedang berjalan hari ini/.test(kepala) && panel === 0 && /^Selesai/.test(kartu);
    if (!ok) rec.verdict = "FAIL";
    await sc.close();
    return `${k.nama} signed in with the class card and reached the home: the honest end reads "${habis}"; the heading reads "${kepala}" ` +
      `(«sedang berjalan hari ini» ${/sedang berjalan hari ini/.test(kepala) ? "PRESENT" : "absent"}); next-step panels ${panel}; the chapter card reads "${kartu}"`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "j6-13-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});

// D-084 J6.14 (STU-20): every learner screen switches between ID and EN with the control in the header; the content
// itself is never translated. Citra presses «EN» on her home, reads it in English, opens Bab 1's first lesson (its
// chrome in English, its text exactly as written), and presses «ID» to come back.
await step("S21g", "a student switches the screens to English with «EN» and back with «ID»; the home and the lesson's chrome change, the lesson's text does not (J6.14, STU-20)", async (rec) => {
  if (!lintasPerangkat || !kartuKelas[2]) { rec.verdict = "BLOCKED"; return "S21c left no lesson to open, or no class card (S20)"; }
  const k = kartuKelas[2];
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const bacaPelajaran = async () => {
      await s.goto(`${APP}${lintasPerangkat.pelajaran}`, { waitUntil: "networkidle" });
      await tutupTur(s);
      return {
        posisi: norm(await s.locator("p.pin-lpos span").first().innerText().catch(() => "")),
        isi: norm(await s.locator("article.pin-prose").first().innerText().catch(() => "")).slice(0, 200),
      };
    };
    const id1 = await bacaPelajaran();
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    // a skipped tour presents itself again on a later arrival (up to its limit) and holds the page while it is up:
    // the student closes it first, as on every arrival here
    await tutupTur(s);
    await s.locator(".pin-lang").getByRole("button", { name: "EN", exact: true }).first().click();
    await s.getByRole("heading", { name: /Your learning/i }).first().waitFor({ timeout: SLOW });
    const rumahEn = norm(await s.locator("main").innerText().catch(() => "")).slice(0, 200);
    rec.shots.push(await shot(s, "j6-14-beranda-en"));
    const en = await bacaPelajaran();
    rec.shots.push(await shot(s, "j6-14-pelajaran-en"));
    await s.locator(".pin-lang").getByRole("button", { name: "ID", exact: true }).first().click();
    await s.locator("p.pin-lpos span", { hasText: "Halaman" }).first().waitFor({ timeout: SLOW });
    const id2 = norm(await s.locator("p.pin-lpos span").first().innerText().catch(() => ""));
    const ok = /^Halaman /.test(id1.posisi) && /^Page /.test(en.posisi) && /^Halaman /.test(id2)
      && !!id1.isi && en.isi === id1.isi;
    if (!ok) rec.verdict = "FAIL";
    await sc.close();
    return `${k.nama}: the lesson in Indonesian reads "${id1.posisi}"; after «EN» the home reads "${rumahEn.slice(0, 120)}", ` +
      `the lesson's chrome "${en.posisi}" and its text unchanged ${en.isi === id1.isi} ("${en.isi.slice(0, 80)}"); after «ID» "${id2}"`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "j6-14-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});
// ───────────────────────── the recorded unwalked checks (D-100(d) item 4): STU-16, STU-17, HOD-07, X-11, HOD-08
async function masukKartu(page, k) {
  await page.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await page.locator("#kartu").fill(k.number);
  await page.locator("#pin").fill(k.pin);
  await page.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
}
const KATA_INTERNAL = /\b(PINTAR 4\.0|FROZEN|SUPERSEDED|VALIDATION_FAILED|IN_REVIEW|INGESTED|STRUCTURED|SYNTHETIC|PUBLIC_DEMO|PREVIEW|OFFICIAL|evidence_class|per_domain|is_correct)\b/;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/;

// STU-16 (J6.12): a student comes back to a finished chapter and reviews it. The review is her own: each question of
// the Uji Penguasaan with whether she had it and her own answer, and the explanation the chapter gives; nothing of the
// machinery (no internal word, no identifier, no weighting) and nobody else's answers.
await step("S21h", "a student comes back to her finished chapter from her home («Lihat hasil») and reviews it: her own answers, each question's explanation, nothing internal and nobody else's (STU-16, J6.12)", async (rec) => {
  if (!terbitBab || kartuKelas.length < MURID.length) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "class cards missing (S20)"; }
  const tugas = tugasBab();
  const k = kartuKelas[0];
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await masukKartu(s, k);
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const lihat = s.locator(`a[href="/belajar/${tugas}/hasil"]`);
    if (!(await lihat.count())) { rec.verdict = "FAIL"; return `her home offers no way back to the finished chapter's result: ${(await bodyText(s)).slice(0, 240)}`; }
    await lihat.first().click();
    await s.waitForURL((u) => u.pathname === `/belajar/${tugas}/hasil`, { timeout: SLOW });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    await tutupTur(s);
    const butir = s.locator(".pin-tinjau details.pin-item");
    const n = await butir.count();
    // the questions of her latest Uji Penguasaan sitting on this chapter
    const harap = Number(sql(`select count(*) from public.presented_items pi where pi.session_id = (
      select ss.id from public.assessment_sessions ss join public.assessment_definitions d on d.id = ss.assessment_definition_id
        join public.persons p on p.id = ss.person_id
       where ss.learning_assignment_id = '${tugas}' and d.mode::text = 'POST_TEST' and p.display_name = '${k.nama}'
       order by ss.created_at desc limit 1)`).trim() || 0);
    for (let i = 0; i < n; i++) await butir.nth(i).locator("summary").click();
    const teks = norm(await s.locator("main").innerText());
    rec.shots.push(await shot(s, "stu16-tinjau"));
    const milikSendiri = (await s.locator(".pin-tinjau .pin-mine").count()) > 0;
    const orangLain = MURID.filter((m) => m !== k.nama && teks.includes(m));
    const internal = KATA_INTERNAL.exec(teks)?.[0] ?? null;
    const pengenal = UUID.exec(teks)?.[0] ?? null;
    if (n === 0 || n !== harap || !milikSendiri || orangLain.length || internal || pengenal) rec.verdict = "FAIL";
    return `${k.nama} reached «${norm(await s.locator("h1").first().innerText())}» from her home; ${n} question(s) under review (her Uji Penguasaan had ${harap}); ` +
      `her own answers shown ${milikSendiri}; other learners named ${orangLain.length ? orangLain.join(", ") : "none"}; internal word ${internal ?? "none"}; identifier ${pengenal ?? "none"}`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "stu16-berhenti"));
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  } finally {
    await sc.close();
  }
});

// STU-17: the certificate's state as a student meets it. Above the school's target (Ani, 7 of 8 against 60%) her
// certificate is listed and, issued, opens with its actions; below it (Eka, 4 of 8) there is none, and opening the
// chapter's certificate page, which asks the system on the learner's behalf, creates none: rendering never issues one.
await step("S21i", "the certificate as students meet it: above the target it is listed and opens issued with its actions; below the target there is none, and opening the certificate page creates none (STU-17)", async (rec) => {
  if (!terbitBab || kartuKelas.length < MURID.length) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "class cards missing (S20)"; }
  const tugas = tugasBab();
  const sertifikatDari = (nama) => sql(`select coalesce(string_agg(c.status::text, ','), '') from public.certificates c
    join public.persons p on p.id = c.person_id where p.display_name = '${nama}' and c.institution_id = '${ids.sd}'`).trim();
  const notes = [];
  const lulus = kartuKelas.find((k) => k.nama === MURID[0]);
  const belum = kartuKelas.find((k) => k.nama === MURID[4]);
  // above the target
  const ac = await ctx();
  const a1 = await ac.newPage();
  try {
    await masukKartu(a1, lulus);
    const sebelum = sertifikatDari(lulus.nama);
    await a1.goto(`${APP}/belajar/sertifikat`, { waitUntil: "networkidle" });
    await tutupTur(a1);
    const daftar = norm(await bodyText(a1));
    const baris = a1.locator(`a[href="/belajar/${tugas}/sertifikat"]`);
    const setelahDaftar = sertifikatDari(lulus.nama);
    rec.shots.push(await shot(a1, "stu17-daftar"));
    notes.push(`${lulus.nama}: certificates before ${sebelum || "none"}; the list shows ${/Berlaku/.test(daftar) ? "«Berlaku»" : /Sedang disiapkan/.test(daftar) ? "«Sedang disiapkan»" : "no state"} and links the chapter ${await baris.count()} time(s); after rendering the list ${setelahDaftar || "none"}`);
    if (!(await baris.count()) || setelahDaftar !== sebelum) { rec.verdict = "FAIL"; }
    else {
      await baris.first().click();
      await a1.waitForURL((u) => u.pathname === `/belajar/${tugas}/sertifikat`, { timeout: SLOW });
      // a click is a client-side move: the address changes while the page still says «Memuat halaman…», and the load
      // state was reached long before, so the certificate is read once its own actions or its state are on screen
      await a1.getByText(/Cetak atau simpan PDF|disiapkan/i).first().waitFor({ timeout: SLOW }).catch(() => {});
      const isi = norm(await bodyText(a1));
      rec.shots.push(await shot(a1, "stu17-sertifikat"));
      const terbit = sertifikatDari(lulus.nama).split(",").includes("ISSUED");
      const aksi = /Cetak atau simpan PDF/.test(isi) && /Periksa keaslian|Tautan verifikasi|Salin tautan verifikasi/.test(isi);
      const disiapkan = !terbit && /disiapkan/i.test(isi);
      notes.push(`opened: ${terbit ? `issued, with its actions ${aksi}` : `not yet issued, «being prepared» shown ${disiapkan}`}`);
      if (terbit ? !aksi : !disiapkan) rec.verdict = "FAIL";
      // Batch 6 (W3.19, DAISY-36, W3.22): printed, the issued certificate is one A4 page of the sheet alone
      if (terbit) {
        await a1.emulateMedia({ media: "print" });
        const cetak = await a1.evaluate(() => {
          const kelihatan = (el) => { const r = el.getBoundingClientRect(); const g = getComputedStyle(el); return r.width > 0 && r.height > 0 && g.display !== "none" && g.visibility !== "hidden"; };
          const lembar = document.querySelector(".pin-sheet");
          const luar = lembar ? [...document.body.querySelectorAll("body *")].filter((el) => kelihatan(el) && !el.contains(lembar) && !lembar.contains(el)).length : -1;
          const w = lembar ? lembar.getBoundingClientRect().width : 0;
          return { ada: !!lembar && kelihatan(lembar), luar, lebarMm: Math.round((w * 25.4) / 96) };
        });
        const pdf = join(OUT, "stu17-sertifikat-A4.pdf");
        await a1.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
        const halaman = (readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
        rec.shots.push(await shot(a1, "stu17-sertifikat-cetak"));
        await a1.emulateMedia({ media: "screen" });
        notes.push(`printed: the sheet ${cetak.ada ? `alone (${cetak.luar} other element(s) visible), ${cetak.lebarMm} mm wide` : "missing"}; the A4 PDF has ${halaman} page(s)`);
        if (!cetak.ada || cetak.luar !== 0 || cetak.lebarMm !== 210 || halaman !== 1) rec.verdict = "FAIL";
      }
    }
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a1, "stu17-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await ac.close();
  }
  // below the target
  const bc = await ctx();
  const b1 = await bc.newPage();
  try {
    await masukKartu(b1, belum);
    const sebelum = sertifikatDari(belum.nama);
    await b1.goto(`${APP}/belajar/sertifikat`, { waitUntil: "networkidle" });
    await tutupTur(b1);
    const daftar = norm(await bodyText(b1));
    await b1.goto(`${APP}/belajar/${tugas}/sertifikat`, { waitUntil: "networkidle" });
    const halaman = norm(await bodyText(b1));
    await b1.goto(`${APP}/belajar/${tugas}/sertifikat`, { waitUntil: "networkidle" });
    rec.shots.push(await shot(b1, "stu17-belum"));
    const setelah = sertifikatDari(belum.nama);
    const kosong = /Belum ada sertifikat untuk Anda di sini/.test(daftar);
    const tanpaKredensial = !/Cetak atau simpan PDF|Tautan verifikasi|Berlaku/.test(halaman);
    notes.push(`${belum.nama}: certificates before ${sebelum || "none"}, after opening the certificate page twice ${setelah || "none"}; the list says none ${kosong}; the chapter's page shows no credential ${tanpaKredensial}`);
    if (sebelum !== "" || setelah !== "" || !kosong || !tanpaKredensial) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(b1, "stu17-belum-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await bc.close();
  }
  return notes.join("; ");
});


await step("S22", "the teacher reaches Lihat bukti by clicking and reads the class figures from official evidence, follows «Lihat per soal» to the questions the class found hard (M5, D-088(k)), then opens a student's record from the roster (EDU-12, X-10, EDU-J03, M4)", async (rec) => {
  if (!HARAP) { rec.verdict = "BLOCKED"; return "the chapter fixture is absent"; }
  const kelas = kelasSatuA();
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru.email);
  // EDU-J03: by clicking, from the teacher's home: the class, then «Lihat bukti»
  let jalan = "clicked /mengajar → Kelas 1A → «Lihat bukti»";
  try {
    await t.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await tutupTur(t);
    await t.locator(`a[href="/mengajar/${kelas}"]`).first().click();
    await t.waitForURL((u) => u.pathname === `/mengajar/${kelas}`, { timeout: SLOW });
    await tutupTur(t);
    await t.getByRole("link", { name: "Lihat bukti", exact: true }).first().click();
    await t.waitForURL((u) => u.pathname === `/mengajar/${kelas}/bukti`, { timeout: SLOW });
  } catch (e) {
    rec.verdict = "FAIL";
    jalan = `the click path stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
    await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
  }
  await t.locator("h1").first().waitFor({ timeout: SLOW });
  await tutupTur(t);
  rec.shots.push(await shot(t, "d064-guru-bukti"));
  const txt = await bodyText(t);
  const simpulan = norm(await t.locator("main .pin-sec").nth(1).innerText().catch(() => ""));
  const pahamTeks = persen(HARAP.paham);
  const naikTeks = `${HARAP.naik > 0 ? "+" : ""}${Math.round(HARAP.naik * 100)} poin`;
  const absen = (simpulan.match(/Belum ada bukti yang memenuhi syarat untuk angka ini\./g) ?? []).length;
  const kumpul = [...txt.matchAll(/Mengumpulkan\s*(\d+)\s*\/\s*(\d+)/gi)].map((m) => `${m[1]}/${m[2]}`);
  const bagian = simpulan.includes("Penguasaan per bagian");
  if (!simpulan.includes(pahamTeks) || !simpulan.includes(naikTeks)) rec.verdict = "FAIL";
  // D-088(k), M5: from «Lihat bukti» the teacher follows the Uji Penguasaan's «Lihat per soal» and reads which questions
  // the class found hard: five handed in, every question once with its key, the right answers adding up to the plan,
  // hardest first, and as needing help exactly the students the plan has missing a question (never Dodi, all right)
  let perSoal = "";
  try {
    const post = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
       where d.course_id='${babSatu()}' and d.mode='POST_TEST' and aa.node_id='${kelas}' order by aa.created_at desc limit 1`).trim();
    await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
    await tutupTur(t);
    const tautan = t.locator(`a[href="/mengajar/${kelas}/soal?penugasan=${post}"]`);
    if (!(await tautan.count())) throw new Error("no «Lihat per soal» for the Uji Penguasaan on «Lihat bukti»");
    const label = norm(await tautan.first().innerText());
    await tautan.first().click();
    await t.waitForURL((u) => u.pathname === `/mengajar/${kelas}/soal`, { timeout: SLOW });
    await t.locator("h1").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(t, "m5-guru-per-soal"));
    const baris = await t.locator("li.pin-soal-baris").evaluateAll((els) => els.map((e) => ({
      tepat: (e.querySelector(".pin-soal-tepat")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      kunci: e.querySelectorAll(".pin-soal-opsi li.pin-opsi-kunci").length,
      bantuan: [...e.querySelectorAll(".pin-soal-bantuan li")].map((li) => (li.textContent ?? "").replace(/\s+/g, " ").trim()),
    })));
    const halaman = norm(await bodyText(t));
    const terkumpul = Number(halaman.match(/Jawaban yang sudah dikumpulkan · (\d+)/)?.[1] ?? -1);
    const angka = baris.map((b) => b.tepat.match(/^(\d+) dari (\d+) menjawab tepat$/)).map((m) => (m ? [Number(m[1]), Number(m[2])] : null));
    const tepatRencana = RENCANA.reduce((n, r) => n + r.post, 0);
    const tepatTerbaca = angka.reduce((n, a) => n + (a?.[0] ?? 0), 0);
    const urut = angka.every((a, i) => a && (i === 0 || angka[i - 1][0] <= a[0]));
    const nama = new Set(baris.flatMap((b) => b.bantuan.map((x) => x.split(" · ")[0])));
    const harapNama = new Set(MURID.filter((_, i) => RENCANA[i].post < SOAL.post));
    const namaSama = nama.size === harapNama.size && [...harapNama].every((x) => nama.has(x));
    const bantuanRencana = RENCANA.reduce((n, r) => n + (SOAL.post - r.post), 0);
    const bantuanTerbaca = baris.reduce((n, b) => n + b.bantuan.length, 0);
    // the page's own words (its heading, its explanation, its labels), not the chapter's questions
    const kata = norm(`${await t.locator("main .pin-head").innerText()} ${(await t.locator(".pin-soal-bantuan .pin-ml").allInnerTexts()).join(" ")}`);
    const pengawasan = /integritas|anomali|perangkat|durasi|lama mengerjakan|ragu|curang/i.test(kata);
    const ok = label === "Lihat per soal" && terkumpul === MURID.length && baris.length === SOAL.post
      && angka.every((a) => a && a[1] === MURID.length) && baris.every((b) => b.kunci === 1)
      && tepatTerbaca === tepatRencana && urut && namaSama && bantuanTerbaca === bantuanRencana && !pengawasan;
    if (!ok) rec.verdict = "FAIL";
    perSoal = `M5: «${label}» → /soal: handed in ${terkumpul} (expected ${MURID.length}); ${baris.length} question(s) (expected ${SOAL.post}), ` +
      `each with one key: ${baris.every((b) => b.kunci === 1)}; right answers ${tepatTerbaca} (plan ${tepatRencana}), hardest first: ${urut}; ` +
      `${JSON.stringify(baris.map((b) => b.tepat))}; may need help: ${[...nama].sort().join(", ") || "none"} (expected ${[...harapNama].sort().join(", ")}), ` +
      `${bantuanTerbaca} line(s) (plan ${bantuanRencana}); nothing reading like an integrity console: ${!pengawasan}`;
  } catch (e) {
    rec.verdict = "FAIL";
    perSoal = `M5: the per-question page was not read: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  // M4 (EDU-J04): from the class's roster, the teacher opens student 1's record
  let catatan = "";
  try {
    await t.goto(`${APP}/mengajar/${kelas}`, { waitUntil: "networkidle" });
    await t.getByRole("link", { name: MURID[0], exact: true }).first().click();
    await t.waitForURL((u) => u.pathname.startsWith(`/mengajar/${kelas}/murid/`), { timeout: SLOW });
    await t.locator("h1").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(t, "m4-guru-murid"));
    const h1 = norm(await t.locator("h1").first().innerText());
    const tugasM = norm(await t.locator('section[aria-labelledby="pin-murid-tugas"]').innerText().catch(() => ""));
    const hasilM = norm(await t.locator('section[aria-labelledby="pin-murid-hasil"]').innerText().catch(() => ""));
    const pre = persen(RENCANA[0].pre / SOAL.pre), post = persen(RENCANA[0].post / SOAL.post);
    const ok = h1 === MURID[0] && (tugasM.match(/Sudah mengumpulkan/g) ?? []).length >= 2 && hasilM.includes(post);
    if (!ok) rec.verdict = "FAIL";
    catatan = `M4: ${MURID[0]}'s record: "${h1}"; assessments: "${tugasM.slice(0, 200)}"; results: "${hasilM.slice(0, 200)}" (expected the Uji Penguasaan at ${post}; Pemetaan Awal ${pre} shown ${hasilM.includes(pre)})`;
  } catch (e) {
    rec.verdict = "FAIL";
    catatan = `M4: the record was not reached: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  await tc.close();
  return `${jalan}; ${perSoal}; ${catatan}; expected comprehension ${pahamTeks} and net gain ${naikTeks} (from the plan); on the page: comprehension ${simpulan.includes(pahamTeks)}, ` +
    `net gain ${simpulan.includes(naikTeks)}, mastery by part shown ${bagian}; figures still absent: ${absen} (misconceptions need registered codes, D-063); ` +
    `Mengumpulkan ${JSON.stringify(kumpul)}; the figures section says: "${simpulan.slice(0, 700)}"`;
});

// W1.5 / J4.10 (Batch 3; UX-01): THE MISCONCEPTION FEEDBACK, ASSERTED IN A BROWSER. Every wrong option of the synthetic
// Bab 1 names a misconception its own package defines (CR-50, F20-M03), so the five students' planned wrong answers (S21)
// are evidence for «Pemahaman keliru yang berulang di kelas ini» on «Lihat bukti». The teacher reads it there: each row is
// one of the package's definitions by its label, with how often it occurred and its remediation (how to help); the most
// frequent first; the counts add up to no more than the class's own wrong answers carrying a code (the view under the
// figure, read here as the database holds it); and no student is named in it (the class aggregate, never a learner).
await step("S22m", "the teacher reads the misunderstandings that recur in Kelas 1A on «Lihat bukti»: each one the chapter's package defines, by its label, with how often it occurred and how to help, the most frequent first, counted from the class's own wrong answers and naming no student (J4.10; CR-50: a package carries its definitions)", async (rec) => {
  if (!terbitBab || !HARAP) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "the chapter fixture is absent"; }
  const kelas = kelasSatuA();
  if (!kelas) { rec.verdict = "BLOCKED"; return "no Kelas 1A"; }
  const paket = JSON.parse(readFileSync(new URL("./fixtures/sd5-sintetis-bab1.paket.json", import.meta.url), "utf8"));
  const definisi = new Map((paket.misconceptions ?? []).map((m) => [norm(m.label), norm(m.remediation)]));
  const minimum = Number(sql(`select d.minimum_sample from public.metric_definitions d join public.metric_catalogue c on c.version = d.catalogue_version
     where c.superseded_by is null and d.metric_id = 'class.misconceptions' order by c.effective_from desc limit 1`).trim() || 0);
  const dasar = Number(sql(`select coalesce(sum(occurrences), 0) from public.service_cohort_misconceptions
     where institution_id = '${ids.sd}' and class_node_id = '${kelas}'`).trim() || 0);
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru.email);
  await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
  await tutupTur(t);
  await t.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(t, "j410-guru-miskonsepsi"));
  const blok = t.locator(".pin-metric", { has: t.locator("ul.pin-keliru") });
  const judul = norm(await blok.locator(".pin-ml").first().innerText().catch(() => ""));
  const baris = await t.locator("ul.pin-keliru li").evaluateAll((els) => els.map((e) => ({
    label: (e.querySelector(".pin-kl")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    kali: Number(((e.querySelector(".pin-ms")?.textContent ?? "").match(/\d+/) ?? ["-1"])[0]),
    bantu: (e.querySelector(".pin-kr")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  })));
  const teksBlok = norm(await blok.innerText().catch(() => ""));
  await tc.close();
  const jumlah = baris.reduce((n, b) => n + b.kali, 0);
  const dikenal = baris.every((b) => definisi.has(b.label) && definisi.get(b.label) === b.bantu);
  const urut = baris.every((b, i) => b.kali >= 1 && (i === 0 || baris[i - 1].kali >= b.kali));
  const tanpaNama = !MURID.some((m) => teksBlok.includes(m));
  const ok = minimum > 0 && dasar >= minimum && judul === "Pemahaman keliru yang berulang di kelas ini" && baris.length >= 1
    && dikenal && urut && jumlah > 0 && jumlah <= dasar && tanpaNama;
  if (!ok) rec.verdict = "FAIL";
  return `the figure «${judul}»: ${baris.length} row(s) ${JSON.stringify(baris.map((b) => `${b.label} · ${b.kali}`))}; each the package's own definition with its remediation: ${dikenal}; ` +
    `most frequent first: ${urut}; ${jumlah} on the page of ${dasar} wrong answers carrying a code in the class (the figure needs ${minimum}); no student named: ${tanpaNama}`;
});

// D-085 M3 (J5.12): the teacher may give material back to the learners who need it. From «Lihat bukti», Bab 1's Uji
// Penguasaan leads to «Minta membaca lagi»: Eka (4 of 8, under the school's 60%) is listed first and ticked, the others
// not; the teacher keeps two lessons and sends it. Eka finds «Diminta guru Anda» on her home, opens the first lesson
// from it, which starts at its first page although she had read it, reads to its last page, and it reads «sudah dibaca
// lagi»; the teacher's page counts one of two read.
await step("S22b", "the teacher asks the learner under the target to read two lessons again from «Lihat bukti»; she finds the request on her home, reads the first lesson again from its first page to its last, and the teacher sees it counted (D-085 M3, J5.12)", async (rec) => {
  const kelas = kelasSatuA();
  const k = kartuKelas.find((x) => x.nama === MURID[MURID.length - 1]);
  if (!terbitBab || !kelas || !k) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "no Kelas 1A or no card for Eka Murid"; }
  const eka = sql(`select e.person_id from public.enrollments e join public.persons p on p.id = e.person_id
    where p.display_name = 'Eka Murid' and e.institution_id = '${ids.sd}' limit 1`).trim();
  const notes = [];
  let permintaan = "";
  const tc = await ctx();
  const t = await tc.newPage();
  try {
    await magicSignIn(t, people.guru.email);
    await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
    await tutupTur(t);
    const ke = t.locator(`a[href^="/mengajar/${kelas}/ulang?penugasan="]`);
    if (!(await ke.count())) {
      rec.verdict = (await bodyText(t)).includes("Lihat per soal") ? "FAIL" : "NOTE";
      return rec.verdict === "NOTE" ? "this candidate has no «Minta membaca lagi» (before D-085 M3's request to read again)" : "«Lihat bukti» offers no «Minta membaca lagi» for Bab 1's Uji Penguasaan";
    }
    await ke.first().click();
    await t.waitForURL((u) => u.pathname === `/mengajar/${kelas}/ulang`, { timeout: SLOW });
    await t.locator("h1").first().waitFor({ timeout: SLOW });
    const pertama = await t.locator("li[data-murid]").first().getAttribute("data-murid");
    const dicentang = await t.locator('input[name="murid"]:checked').evaluateAll((es) => es.map((e) => e.value));
    const tanda = norm(await t.locator(`li[data-murid="${eka}"]`).innerText().catch(() => ""));
    rec.shots.push(await shot(t, "m3-ulang-pilih"));
    notes.push(`listed first: Eka ${pertama === eka}; ticked by default: ${dicentang.length === 1 && dicentang[0] === eka ? "Eka only" : JSON.stringify(dicentang.length)}; her line reads "${tanda}"`);
    if (pertama !== eka || dicentang.length !== 1 || dicentang[0] !== eka || !/di bawah target/i.test(tanda)) rec.verdict = "FAIL";
    const pel = t.locator('input[name="pelajaran"]');
    const nPel = await pel.count();
    for (let i = 2; i < nPel; i++) await pel.nth(i).uncheck();
    await t.getByRole("button", { name: "Minta membaca lagi", exact: true }).click();
    await t.waitForURL((u) => u.searchParams.get("ulang") !== null, { timeout: SLOW }).catch(() => {});
    await t.waitForLoadState("networkidle");
    const terkirim = /Permintaan dikirim kepada 1 murid/.test(await bodyText(t));
    rec.shots.push(await shot(t, "m3-ulang-terkirim"));
    const r = sql(`select r.id || '|' || (select count(*) from public.lesson_review_items i where i.request_id = r.id)
      from public.lesson_review_requests r where r.person_id = '${eka}' order by r.requested_at desc limit 1`).trim();
    permintaan = r.split("|")[0];
    notes.push(`sent: ${terkirim}; recorded: ${r ? `${r.split("|")[1]} lesson(s)` : "nothing"} of ${nPel}`);
    if (!terkirim || r.split("|")[1] !== "2") { rec.verdict = "FAIL"; return notes.join("; "); }
  } finally {
    await tc.close();
  }

  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const tautan = s.locator(`#pin-diminta a[href*="?ulang=${permintaan}"]`);
    const ada = await tautan.count();
    rec.shots.push(await shot(s, "m3-ulang-beranda"));
    notes.push(`her home asks her to read ${ada} lesson(s) again`);
    if (ada !== 2) { rec.verdict = "FAIL"; return notes.join("; "); }
    await tautan.first().click();
    await s.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const awal = norm(await s.locator("p.pin-lpos").first().innerText().catch(() => ""));
    for (let i = 0; i < 30; i++) {
      const lanjut = s.getByRole("button", { name: "Halaman berikutnya", exact: true });
      if (!(await lanjut.isEnabled().catch(() => false))) break;
      await lanjut.click();
      await s.waitForTimeout(300);
    }
    const akhir = norm(await s.locator("p.pin-lpos").first().innerText().catch(() => ""));
    let dibaca = "0";
    for (let i = 0; i < 20 && dibaca === "0"; i++) {
      await s.waitForTimeout(500);
      dibaca = sql(`select count(*) from public.lesson_review_items where request_id = '${permintaan}' and read_at is not null`).trim();
    }
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    const tandaBeranda = await s.locator(`#pin-diminta li[data-dibaca="ya"]`).count();
    rec.shots.push(await shot(s, "m3-ulang-dibaca"));
    notes.push(`the lesson opened at "${awal}" and was read to "${akhir}"; marked read again: ${dibaca}; her home shows ${tandaBeranda} read`);
    if (!/^Halaman 1\//.test(awal) || dibaca !== "1" || tandaBeranda !== 1) rec.verdict = "FAIL";
  } finally {
    await sc.close();
  }

  const tc2 = await ctx();
  const t2 = await tc2.newPage();
  try {
    await magicSignIn(t2, people.guru.email);
    const p = sql(`select aa.id from public.assessment_assignments aa join public.lesson_review_requests r on r.learning_assignment_id = aa.learning_assignment_id
      join public.assessment_definitions d on d.id = aa.assessment_definition_id where r.id = '${permintaan}' and d.mode = 'POST_TEST' limit 1`).trim();
    await t2.goto(`${APP}/mengajar/${kelas}/ulang?penugasan=${p}`, { waitUntil: "networkidle" });
    const baris = norm(await t2.locator(`[data-permintaan="${eka}"]`).first().innerText().catch(() => ""));
    rec.shots.push(await shot(t2, "m3-ulang-guru"));
    notes.push(`the teacher reads "${baris}"`);
    if (!/1 dari 2/.test(baris)) rec.verdict = "FAIL";
  } finally {
    await tc2.close();
  }
  return notes.join("; ");
});

await step("S23", "the head of department reads Kelas 1A's figures beside the class's size on /pimpinan, opens and prints the class's report and comes back, reads their department's roster and opens a learner's record from it (HOD-09, X-10, HOD-J05, HOD-J06, HOD-J09)", async (rec) => {
  if (!HARAP) { rec.verdict = "BLOCKED"; return "the chapter fixture is absent"; }
  const hc = await ctx();
  const h = await hc.newPage();
  await magicSignIn(h, people.kaprodi.email);
  await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
  await tutupTur(h);
  const kelasBukti = h.locator("details.pin-kelas-bukti").filter({ has: h.locator("summary", { hasText: "Kelas 1A" }) }).first();
  if (!(await kelasBukti.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(h, "d064-kaprodi-pimpinan"));
    const t0 = await bodyText(h);
    await hc.close();
    return `no Kelas 1A in the class-by-class section; the page says: ${t0.slice(0, 400)}`;
  }
  const tanda = norm(await kelasBukti.locator("summary").innerText());
  await kelasBukti.locator("summary").click();
  rec.shots.push(await shot(h, "d064-kaprodi-pimpinan"));
  const isi = norm(await kelasBukti.innerText());
  const pahamTeks = persen(HARAP.paham);
  // W9: the net gain reads as «Lihat bukti» reads it (S22), not as a percentage
  const naikTeks = `${HARAP.naik > 0 ? "+" : ""}${Math.round(HARAP.naik * 100)} poin`;
  // HOD-J05: «Peserta» is read against the class: its size now, in the same panel
  const ukuran = isi.match(/Murid di kelas ini sekarang · (\d+)/);
  if (!/Ada angka/.test(tanda) || !isi.includes(pahamTeks) || !isi.includes(naikTeks) || Number(ukuran?.[1]) !== MURID.length) rec.verdict = "FAIL";
  // HOD-J09: the class's report from its panel; it prints without its controls, and «Kembali» returns to /pimpinan
  let laporan = "";
  try {
    await kelasBukti.getByRole("link", { name: "Buka ringkasan kelas ini" }).click();
    await h.waitForURL((u) => u.pathname === "/edukator/ringkasan", { timeout: SLOW });
    await h.locator("h1").first().waitFor({ timeout: SLOW });
    const cetak = h.getByRole("button", { name: "Cetak laporan", exact: true });
    const adaCetak = (await cetak.count()) === 1;
    await h.emulateMedia({ media: "print" });
    const tercetak = adaCetak && !(await cetak.isVisible()) && (await h.locator("h1").first().isVisible());
    rec.shots.push(await shot(h, "hod-j09-laporan-cetak"));
    await h.emulateMedia({ media: "screen" });
    // E-K1 / H9 (D-173(d)): opened from Pimpinan, the report's way back is named «Pimpinan»; opened by address, it is
    // the history-back, named as one
    await h.getByRole("link", { name: /^← (Pimpinan|Kembali ke halaman sebelumnya)$/ }).click();
    await h.waitForURL((u) => u.pathname === "/pimpinan", { timeout: SLOW });
    await h.locator('section[aria-labelledby="pin-bukti"]').first().waitFor({ timeout: SLOW }).catch(() => {});
    laporan = `report: print offered ${adaCetak}, prints the report without its controls ${tercetak}, the way back («Pimpinan» or the history-back) on /pimpinan true`;
    if (!tercetak) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    laporan = `report: stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  // W10: above the class. What «Yang didukung bukti» says to a head of department over a department, and
  // the department's roster, reached by clicking (Lihat lebih rinci → Murid dalam lingkup ini; Terminology v1, ruling 19)
  const bagianC = norm(await h.locator('section[aria-labelledby="pin-bukti"]').innerText().catch(() => ""));
  const kosongC = /Belum ada angka yang bisa ditampilkan/.test(bagianC);
  let roster = "";
  let bawahDept = "";
  try {
    await h.getByRole("link", { name: "Lihat lebih rinci" }).first().click();
    await h.waitForURL((u) => /^\/pimpinan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
    // W11: the parts offered below the department are Tingkat and Kelas, never the hidden «Reguler» or «Jenjang»
    bawahDept = norm(await h.locator('section[aria-labelledby="pin-bawah"]').innerText().catch(() => ""));
    await h.getByRole("link", { name: "Murid dalam lingkup ini" }).first().click();
    await h.waitForURL((u) => u.pathname.endsWith("/murid"), { timeout: SLOW });
    await h.locator("h1").first().waitFor({ timeout: SLOW });
    roster = await bodyText(h);
    rec.shots.push(await shot(h, "d064-kaprodi-murid"));
  } catch (e) {
    roster = `not reached: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  // HOD-J06: from the department's roster, the head of department opens one learner's record by their name
  let rekam = "";
  try {
    await h.getByRole("link", { name: MURID[0], exact: true }).first().click();
    await h.waitForURL((u) => /\/murid\/[^/]+$/.test(u.pathname), { timeout: SLOW });
    await h.locator("h1").first().waitFor({ timeout: SLOW });
    const namaR = norm(await h.locator("h1").first().innerText());
    const tempatR = norm(await h.locator("main dl").first().innerText().catch(() => ""));
    const catatR = norm(await h.locator('section[aria-labelledby="pin-catatan"]').innerText().catch(() => ""));
    rec.shots.push(await shot(h, "hod-j06-rincian-murid"));
    if (namaR !== MURID[0] || !tempatR.includes("Kelas 1A")) rec.verdict = "FAIL";
    rekam = `HOD-J06: ${MURID[0]}'s record opened from the roster: "${namaR}"; placement "${tempatR.slice(0, 120)}"; learning record: "${catatR.slice(0, 200)}"`;
  } catch (e) {
    rec.verdict = "FAIL";
    rekam = `HOD-J06: the record was not reached from the roster: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  const tercantum = MURID.filter((n) => roster.includes(n)).length;
  const tersembunyi = /\b(Reguler|Jenjang)\b/.test(bawahDept);
  if (kosongC || tercantum < MURID.length || tersembunyi || !bawahDept.includes("Kelas 1A")) rec.verdict = "FAIL";
  // HOD-02: outside the department is refused: the school's root above it, and the other school
  const luar = {};
  for (const [nama, simpul] of [["the school's root", ids.sd], ["the other school", ids.sma]]) {
    await h.goto(`${APP}/pimpinan/${simpul}`, { waitUntil: "networkidle" });
    luar[nama] = (await h.locator(".pin-refusal").count()) > 0 ? "refused" : `opened ("${norm(await h.locator("h1").first().innerText().catch(() => "")).slice(0, 60)}")`;
  }
  rec.shots.push(await shot(h, "hod-02-di-luar-ditolak"));
  if (Object.values(luar).some((v) => v !== "refused")) rec.verdict = "FAIL";
  rekam = `${rekam}; HOD-02 outside the department: ${JSON.stringify(luar)}`;
  await hc.close();
  return `«Yang didukung bukti» says: "${bagianC.slice(0, 160)}"${kosongC ? " (NO FIGURES, while Kelas 1A has them: W10)" : ""}; the department's roster lists ${tercantum} of ${MURID.length} students; below the department: "${bawahDept.slice(0, 160)}"${tersembunyi ? " (HIDDEN LEVEL SHOWN: W11)" : ""}; ` +
    `${laporan} (HOD-J09); ${rekam}; Kelas 1A: "${tanda}", size shown ${ukuran?.[1] ?? "no"} (expected ${MURID.length}: HOD-J05); expected comprehension ${pahamTeks} and net gain ${naikTeks}, as on «Lihat bukti»; comprehension shown ${isi.includes(pahamTeks)}, ` +
    `net gain shown ${isi.includes(naikTeks)}; the class's figures say: "${isi.slice(0, 500)}"`;
});

// ADM-J14: the school admin ends a role on Peran & akses (the revoke button, never clicked before), and the
// head of department, signing in afresh, is refused Pimpinan. Last, because it takes S23's reader away.
// D-084 J7.3 (DEA-02, DEA-03, DEA-06): the dean. The school admin records the dean on Pendataan, gives an account on
// Aktivasi and «Dekan» at the school's root on Peran & akses; the dean signs in like a person, reads the school on
// /pimpinan, opens «Buka ringkasan sekolah» by clicking and reads it (no raw decimal; a figure without enough evidence
// says so); seniority grants no write: Konfigurasi, Aktivasi, Studio and Pendataan refuse the dean.
await step("S23d", "the dean: the school admin adds the dean by the screens; the dean reads the school on /pimpinan, opens «Buka ringkasan sekolah» by clicking, and is refused every place that writes (J7.3, DEA-02, DEA-03, DEA-06)", async (rec) => {
  const jejak = [await catatLewatLayar(a, [people.dekan.name], rec.shots, { kelas: null, peran: null })];
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  const baris = a.locator("li.pin-akt-orang", { hasText: people.dekan.name }).first();
  if (!(await baris.count())) { rec.verdict = "FAIL"; return `${jejak.join(" | ")}; ${people.dekan.name} is not on Aktivasi`; }
  await baris.locator('input[type="email"]').fill(people.dekan.email);
  await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
  await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  const r = await grantViaForm(a, people.dekan.name, "DEAN", "SD Zayd");
  jejak.push(`«Dekan» at the school's root: ${JSON.stringify(r)}`);
  if (r.ok !== "ok") { rec.verdict = "FAIL"; return jejak.join(" | "); }
  const dc = await ctx();
  const d = await dc.newPage();
  try {
    const masuk = await magicSignIn(d, people.dekan.email);
    jejak.push(`signed in, landed on ${masuk.landed}`);
    await d.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    await tutupTur(d);
    const h1 = norm(await d.locator("h1").first().innerText().catch(() => ""));
    const pimpinan = norm(await d.locator("main").innerText().catch(() => ""));
    rec.shots.push(await shot(d, "j7-3-dekan-pimpinan"));
    const ringkas = d.getByRole("link", { name: "Buka ringkasan sekolah", exact: true });
    const adaRingkas = (await ringkas.count()) > 0;
    let laporan = "no «Buka ringkasan sekolah»";
    let laporanOk = false;
    if (adaRingkas) {
      await ringkas.first().click();
      await d.waitForURL((u) => u.pathname === "/dekan/ringkasan", { timeout: SLOW });
      await d.waitForLoadState("networkidle");
      const judul = norm(await d.locator("h1").first().innerText().catch(() => ""));
      const isi = norm(await d.locator("main").innerText().catch(() => ""));
      const mentah = isi.match(/(?<![\d.,])0\.\d{2,}(?!\d)/)?.[0] ?? null;
      rec.shots.push(await shot(d, "j7-3-dekan-ringkasan-sekolah"));
      laporanOk = !!judul && !mentah && !(await d.locator(".pin-refusal").count());
      laporan = `the school summary "${judul}"${mentah ? ` prints a raw decimal "${mentah}"` : ""}: ${isi.slice(0, 360)}`;
    }
    // seniority grants no write: each place that writes refuses the dean
    const tolak = {};
    for (const jalan of ["/konfigurasi", "/aktivasi", "/studio", "/pendataan"]) {
      await d.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
      const ditolak = (await d.locator(".pin-refusal").count()) > 0 || new URL(d.url()).pathname !== jalan;
      const tombolTulis = await d.locator('button:has-text("Berikan peran"), button:has-text("Aktifkan dengan email"), button:has-text("Simpan")').count();
      tolak[jalan] = ditolak ? "refused" : `opened (${tombolTulis} write button(s))`;
    }
    rec.shots.push(await shot(d, "j7-3-dekan-ditolak"));
    const tanpaTulis = Object.values(tolak).every((v) => v === "refused" || /\(0 write/.test(v));
    if (h1 === "" || !adaRingkas || !laporanOk || !tanpaTulis) rec.verdict = "FAIL";
    await dc.close();
    return `${jejak.join(" | ")} | /pimpinan "${h1}": ${pimpinan.slice(0, 300)} | ${laporan} | places that write: ${JSON.stringify(tolak)}`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(d, "j7-3-berhenti"));
    await dc.close();
    return `${jejak.join(" | ")} | stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});
// HOD-07 and X-11: the head of department reviews the class's integrity observations. S21's network drop leaves one
// («Terputus lalu tersambung lagi») on the sitting it happened in. They read as material for a human, never a verdict;
// recording a review writes the reviewer's decision to the audit and changes no score; the student never sees them.
// RESTATED FOR FD-7 (D-127, D-128 L2; DG-32): a reviewed sitting leaves the waiting list, so the one observation can be
// reviewed once. The head of department's review is the referral S23r follows («Diteruskan ke pihak sekolah», with
// S23r's note), and the sitting then leaves her list; until L2 S23i recorded «Tidak ada yang perlu ditindaklanjuti» and
// S23r pressed the same observation twice more.
// S23i's review is the referral S23r follows; its note is how S23r and /pimpinan find it (KartuKeputusan quotes it)
const RUJUK_S23 = "Koneksi terputus saat Uji Penguasaan; mohon dipertimbangkan pihak sekolah.";
await step("S23i", "the head of department reviews Kelas 1A's integrity observations in Studio → «Tinjauan Integritas»: observations, never a verdict; her review («Diteruskan ke pihak sekolah») is recorded and changes no score, and the reviewed sitting leaves her waiting list (FD-7); the student sees none of it (HOD-07, X-11)", async (rec) => {
  const kelas = kelasSatuA();
  const sinyal = kelas ? sql(`select s.id||'|'||p.display_name from public.integrity_signals s join public.assessment_sessions ss on ss.id = s.session_id
    join public.persons p on p.id = ss.person_id where ss.class_node_id = '${kelas}' order by s.observed_at limit 1`).trim() : "";
  if (!sinyal) { rec.verdict = "BLOCKED"; return "no integrity observation in Kelas 1A to review (S21's network drop raises one)"; }
  const [idSinyal, namaMurid] = sinyal.split("|");
  const skor = () => sql(`select coalesce(string_agg(r.session_id::text||':'||r.mastery::text, ',' order by r.session_id::text), '')
    from public.assessment_results r join public.assessment_sessions ss on ss.id = r.session_id where ss.class_node_id = '${kelas}'`).trim();
  const sebelum = skor();
  const dulu = Number(sql(`select coalesce(max(id), 0) from public.audit_log`).trim());
  const notes = [];
  const hc = await ctx();
  const h = await hc.newPage();
  try {
    await magicSignIn(h, people.kaprodi.email);
    // L3 (D-132 C4, C8): she holds Mengajar and Mengelola at SD, so Studio asks which; reviewing integrity is Mengelola's
    await keKonteks(h, { tujuan: "MENGELOLA", nama: "SD Zayd" });
    await h.goto(`${APP}/studio`, { waitUntil: "networkidle" });
    await tutupTur(h);
    await h.getByRole("link", { name: "Tinjauan Integritas" }).first().click();
    await h.waitForURL((u) => u.pathname === "/studio/integritas", { timeout: SLOW });
    // the page's own heading, not Studio's nav link of the same name: until it shows, the page says «Memuat halaman…»
    await h.getByRole("heading", { name: "Tinjauan Integritas", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
    const teks = norm(await bodyText(h));
    rec.shots.push(await shot(h, "hod07-integritas"));
    const bingkai = /bahan pertimbangan manusia, bukan kesimpulan/i.test(teks);
    const vonis = /curang|kecurangan|menyontek|mencontek|pelanggaran|bersalah|dihukum|cheat/i.test(teks);
    const kategori = /Terputus lalu tersambung lagi|Berpindah dari layar (?:penilaian|asesmen)/.test(teks);
    const namaTampak = teks.includes(namaMurid);
    notes.push(`the page frames them as material for a human ${bingkai}, carries a verdict word ${vonis}, names the observation ${kategori}, names the student ${namaTampak}`);
    if (!bingkai || !kategori) notes.push(`the page at ${new URL(h.url()).pathname} says: «${teks.slice(0, 400)}»`);
    const form = h.locator("form").filter({ has: h.locator(`input[name="sinyal"][value="${idSinyal}"]`) }).first();
    // W2.7 (Batch 5; CR-75): the sitting is named by its learner; the Batch 5 walk found every sitting shown as «—»
    if (!(await form.count()) || !bingkai || vonis || !kategori || !namaTampak) { rec.verdict = "FAIL"; return notes.join("; "); }
    await form.locator('select[name="keputusan"]').selectOption({ label: "Diteruskan ke pihak sekolah" });
    await form.locator('input[name="catatan"]').fill(RUJUK_S23);
    await form.getByRole("button", { name: "Catat tinjauan" }).click();
    await h.getByText("Tinjauan Anda dicatat.").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(h, "hod07-dicatat"));
    const tinjauan = sql(`select a.summary->>'decision' from public.audit_log a where a.id > ${dulu} and a.action = 'INTEGRITY_SIGNAL_REVIEWED' and a.target_id = '${idSinyal}'`).trim();
    const sesudah = skor();
    notes.push(`the review «Diteruskan ke pihak sekolah» is on the record as ${tinjauan || "nothing"}; the class's scores unchanged ${sesudah === sebelum}`);
    if (tinjauan !== "REFERRED_TO_INSTITUTION" || sesudah !== sebelum) rec.verdict = "FAIL";
    // FD-7: the reviewed sitting has left her waiting list; with nothing else waiting, the list says so, truly
    await h.goto(`${APP}/studio/integritas`, { waitUntil: "networkidle" });
    await h.getByRole("heading", { name: "Tinjauan Integritas", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
    const masih = await h.locator(`input[name="sinyal"][value="${idSinyal}"]`).count();
    const formLain = await h.locator('form:has(input[name="sinyal"])').count();
    const kosong = /Tidak ada catatan yang menunggu tinjauan\./.test(norm(await bodyText(h)));
    notes.push(`FD-7: after her review the sitting is still offered ${masih > 0}; ${formLain} other sitting(s) wait; the list says nothing waits ${kosong}`);
    if (masih > 0 || (formLain === 0 && !kosong)) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(h, "hod07-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await hc.close();
  }
  // the student whose sitting it was: nothing of it on her home, her result, or Studio's review
  const k = kartuKelas.find((x) => x.nama === namaMurid);
  if (!k) { rec.verdict = "FAIL"; notes.push(`no class card for ${namaMurid}`); return notes.join("; "); }
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await masukKartu(s, k);
    const halaman = [];
    for (const jalur of ["/belajar", `/belajar/${tugasBab()}/hasil`, "/studio/integritas"]) {
      await s.goto(`${APP}${jalur}`, { waitUntil: "networkidle" });
      await tutupTur(s);
      halaman.push([jalur, new URL(s.url()).pathname, norm(await bodyText(s))]);
    }
    rec.shots.push(await shot(s, "x11-murid-studio"));
    const bocor = halaman.filter(([, , t]) => /integritas|Terputus lalu tersambung lagi|Berpindah dari layar (?:penilaian|asesmen)|Tinjauan Integritas/i.test(t)).map(([j]) => j);
    notes.push(`${namaMurid} sees it on ${bocor.length ? bocor.join(", ") : "none of"} /belajar, her result and /studio/integritas (which ends at ${halaman[2][1]})`);
    if (bocor.length) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    notes.push(`the student's check stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await sc.close();
  }
  return notes.join("; ");
});


// C-12 (D-069, D-070, design/EDUCATOR-AS-LEARNER-TICKETS.md §7): Kelas 1A's teacher learns as a participant in a
// professional-learning place, here, while he still teaches Kelas 1A and its figures are settled (before S24 changes
// who leads it). The walk and its snapshot live in c12.mjs and c12-potret.mjs.
await jalankanC12({ step, sql, ctx, magicSignIn, apiSession, grantViaForm, catatDanAktifkan, pastikanAdminSma, catatLewatLayar, kirimPaket, terbitkanLewatLayar, keadaanBab, jawab,
  tutupTur, masukKartu, shot, bodyText, norm, people, ids, a, g, kartuKelas, KUNCI, kelasSatuA, babSatu, SLOW, APP, DB, GLADYS, newPerson, OUT, keKonteks });

// ═══ the closure's batch 2 walks (D-118): CR-38, CR-44, CR-40 and CR-39 through the screens, after C-12's block (its
// baseline and after-snapshot stay around its own writes) and before S24 (which revokes the head of department).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// INSERT AFTER step "C12k" (the `await jalankanC12({...});` call, journey.mjs:2379-2380), before step "S24".
// CR-38 (DEA-04, BOB-39): the decision queue, walked. S23i recorded «Tidak ada yang perlu ditindaklanjuti» on Kelas 1A's
// observation; a review is an audit row and changes nothing on the signal, so the same observation can still be
// referred. The head of department refers it in Studio → «Tinjauan Integritas» («Diteruskan ke pihak sekolah»), which
// raises one INTEGRITY_REFERRAL in management_decisions (record_integrity_review → refer_integrity_signal,
// 20261024100000 / 20261118100000:794-883); pressed again while it is open, the review is recorded again and the
// decision is the same one (idempotent while open). The dean (DEAN at the school's root, S23d) finds it under
// «Keputusan» on /pimpinan, takes it («Saya yang menangani») and records «Tidak ada tindakan lanjutan» with «Catat
// keputusan» (putuskanAksi → advance_management_decision). The referrer sees it decided; no score and no signal row
// moves; the student sees none of it.
// RESTATED FOR FD-7 (DG-32): S23i's review is the referral; the sitting has left the head of department's waiting list,
// so no second referral can be pressed from Studio (the database's own idempotency stays F06-P22's).
await step("S23r", "the head of department's referral of Kelas 1A's integrity observation (S23i, «Diteruskan ke pihak sekolah») is one waiting decision, and Studio no longer offers the sitting (FD-7); the dean finds it under «Keputusan» on /pimpinan, takes it («Saya yang menangani») and records «Tidak ada tindakan lanjutan» with «Catat keputusan»; the referrer sees it decided, on /pimpinan and on Tinjauan Integritas where she referred it (W2.7, CR-77); no score moves and the student sees none of it (CR-38: DEA-04, BOB-39)", async (rec) => {
  const kelas = kelasSatuA();
  // the observation S23i reviewed (S23i's own query, journey.mjs:2304-2305)
  const sinyal = kelas ? sql(`select s.id||'|'||p.display_name from public.integrity_signals s join public.assessment_sessions ss on ss.id = s.session_id
    join public.persons p on p.id = ss.person_id where ss.class_node_id = '${kelas}' order by s.observed_at limit 1`).trim() : "";
  if (!sinyal) { rec.verdict = "BLOCKED"; return "no integrity observation in Kelas 1A to refer (S21's network drop raises one)"; }
  const [idSinyal, namaMurid] = sinyal.split("|");
  const RUJUK = RUJUK_S23;
  const PUTUS = "Sudah dibicarakan dengan wali kelas; koneksi sekolah sedang diperbaiki.";
  const dekanId = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${people.dekan.email}'`).trim();
  const skor = () => sql(`select coalesce(string_agg(r.session_id::text||':'||r.mastery::text, ',' order by r.session_id::text), '')
    from public.assessment_results r join public.assessment_sessions ss on ss.id = r.session_id where ss.class_node_id = '${kelas}'`).trim();
  const sidik = () => sql(`select md5(to_jsonb(s)::text) from public.integrity_signals s where s.id = '${idSinyal}'`).trim();
  const skorAwal = skor();
  const sidikAwal = sidik();
  const dulu = Number(sql(`select coalesce(max(id), 0) from public.audit_log`).trim());
  const audit = (aksi, sasaran, lagi = "") => Number(sql(`select count(*) from public.audit_log where id > ${dulu} and action = '${aksi}' and target_id = '${sasaran}' ${lagi}`).trim());
  // every referral of this observation: id|state|at Kelas 1A|raised by|raised note|about|outcome|decided by|decision note
  const rujukan = () => sql(`select coalesce(string_agg(d.id || '|' || d.state::text || '|' || (d.scope_node_id = '${kelas}')::text || '|' || r.display_name || '|' ||
      coalesce(d.raised_note, '') || '|' || coalesce(s.display_name, '-') || '|' || coalesce(d.outcome::text, '-') || '|' || coalesce(k.display_name, '-') || '|' ||
      coalesce(d.decision_note, ''), chr(10) order by d.raised_at), '')
    from public.management_decisions d join public.persons r on r.id = d.raised_by_person_id
    left join public.persons s on s.id = d.subject_person_id left join public.persons k on k.id = d.decided_by_person_id
   where d.family = 'INTEGRITY_REFERRAL' and d.source_table = 'integrity_signals' and d.source_id = '${idSinyal}'`).split("\n").filter(Boolean).map((b) => b.split("|"));
  // the card, found by the referrer's note it quotes (KartuKeputusan.tsx:57 article.pin-kp, :89 blockquote.pin-kp-catatan), in every state
  const kartu = (page) => page.locator("article.pin-kp").filter({ has: page.locator("blockquote.pin-kp-catatan", { hasText: RUJUK }) });
  // textContent, not innerText: the card's state sits in .pin-eyebrow, drawn in capitals (experience.css:108-111)
  const teks = async (loc) => norm(await loc.first().textContent().catch(() => ""));
  const MENTAH = /INTEGRITY_REFERRAL|AWAITING_REVIEW|UNDER_REVIEW|NO_FURTHER_ACTION|REFERRED_TO_INSTITUTION|integrity_signals|management_decisions/;
  const notes = [`S23i's «Diteruskan ke pihak sekolah» on record for this observation: ${sql(`select count(*) from public.audit_log where action = 'INTEGRITY_SIGNAL_REVIEWED' and target_id = '${idSinyal}' and summary->>'decision' = 'REFERRED_TO_INSTITUTION'`).trim()}`];
  const hc = await ctx();
  const h = await hc.newPage();
  const dc = await ctx();
  const d = await dc.newPage();
  try {
    // 1. S23i's review raised one referral of it, waiting, with her note, about the student; and Studio no longer offers
    //    the sitting to her, so no second referral can be pressed (FD-7)
    await magicSignIn(h, people.kaprodi.email);
    const r1 = rujukan();
    const idKeputusan = r1[0]?.[0] ?? "";
    const diangkat = idKeputusan
      ? Number(sql(`select count(*) from public.audit_log where action = 'management_decision.raised' and target_id = '${idKeputusan}'`).trim()) : 0;
    notes.push(`S23i's «Diteruskan ke pihak sekolah» → referrals of it: ${JSON.stringify(r1.map((x) => x.slice(1, 6)))}; raised on the record ${diangkat}`);
    if (r1.length !== 1 || r1[0][1] !== "AWAITING_REVIEW" || r1[0][2] !== "true" || r1[0][3] !== people.kaprodi.name || r1[0][4] !== RUJUK
        || r1[0][5] !== namaMurid || diangkat !== 1) { rec.verdict = "FAIL"; return notes.join("; "); }
    // L3 (D-132 C4): Studio asks which of her two contexts; asked in Mengelola, so «not offered» is the list's own answer
    await keKonteks(h, { tujuan: "MENGELOLA", nama: "SD Zayd" });
    await h.goto(`${APP}/studio/integritas`, { waitUntil: "networkidle" });
    await tutupTur(h);
    await h.getByRole("heading", { name: "Tinjauan Integritas", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
    const lagi = await h.locator(`input[name="sinyal"][value="${idSinyal}"]`).count();
    const diHalaman = new URL(h.url()).pathname === "/studio/integritas";
    notes.push(`FD-7: Studio still offers the referred sitting to her ${lagi > 0} (on ${new URL(h.url()).pathname})`);
    if (lagi > 0 || !diHalaman) rec.verdict = "FAIL";
    rec.shots.push(await shot(h, "cr38-diteruskan"));

    // 2. the referrer finds it under «Keputusan» on /pimpinan, waiting
    await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    await tutupTur(h);
    const diKaprodi = await teks(kartu(h));
    notes.push(`the head of department's /pimpinan card: «${diKaprodi.slice(0, 220)}»`);
    // (D-140, CR-76 copy owed: the referrer's card states that the case waits on another leader's decision,
    // pimpinan.keadaan.menunggu_keputusan, where a decider's card says «Menunggu tinjauan»)
    if (!/Menunggu keputusan/.test(diKaprodi) || !/Tinjauan integritas/.test(diKaprodi) || !/Kelas 1A/.test(diKaprodi)
        || !/Berasal dari satu catatan integritas\./.test(diKaprodi) || UUID.test(diKaprodi) || MENTAH.test(diKaprodi)) rec.verdict = "FAIL";  // hle.ts:2156
    // CR-76 (D-123(4)): whoever referred it does not decide it. Her card offers neither move and says another leader
    // decides it; the dean stands over Kelas 1A, so it does not say that nobody else can (KartuKeputusan.tsx; hle.ts
    // pimpinan.menunggu_pemutus_lain, pimpinan.belum_ada_pemutus_lain)
    const tombolPerujuk = await kartu(h).first().getByRole("button", { name: /Saya yang menangani|Catat keputusan/ }).count();
    const menungguLain = /jadi pimpinan lain yang memutuskannya/.test(diKaprodi);                         // copy owed (11-validation §4)
    const tiadaLain = /Belum ada pimpinan lain yang boleh memutuskan/.test(diKaprodi);
    notes.push(`CR-76: the referrer is offered ${tombolPerujuk} move(s); the card says another leader decides it ${menungguLain}; says nobody else can ${tiadaLain}`);
    if (tombolPerujuk !== 0 || !menungguLain || tiadaLain) rec.verdict = "FAIL";

    // 3. the dean takes it, then decides it
    await magicSignIn(d, people.dekan.email);
    await d.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    await tutupTur(d);
    const antrean = await teks(d.locator('section[aria-labelledby="pin-antre"]'));                          // pimpinan/page.tsx:143-157
    if (!(await kartu(d).count())) {
      rec.verdict = "FAIL";
      rec.shots.push(await shot(d, "cr38-dekan-tanpa-kartu"));
      notes.push(`the dean's «Keputusan» has no card for it: «${antrean.slice(0, 300)}»`);
      return notes.join("; ");
    }
    const diDekan = await teks(kartu(d));
    rec.shots.push(await shot(d, "cr38-dekan-antrean"));
    notes.push(`the dean's «Keputusan» says «${antrean.slice(0, 60)}»; the card names ${namaMurid}: ${diDekan.includes(`Tentang ${namaMurid}`)}`);  // KartuKeputusan.tsx:67-71
    if (/Tidak ada keputusan yang menunggu Anda/.test(antrean) || !/Menunggu tinjauan/.test(diDekan) || UUID.test(diDekan) || MENTAH.test(diDekan)) rec.verdict = "FAIL";  // hle.ts:2105
    await kartu(d).first().getByRole("button", { name: "Saya yang menangani", exact: true }).click();        // KartuKeputusan.tsx:113-118; hle.ts:2162
    await d.waitForURL((u) => u.searchParams.get("hasil") === "ok" && u.searchParams.get("keputusan") === idKeputusan, { timeout: SLOW }).catch(() => {});  // pimpinan/actions.ts:66
    for (let i = 0; i < 20 && rujukan()[0]?.[1] !== "UNDER_REVIEW"; i++) await d.waitForTimeout(500);
    await kartu(d).first().getByText("Sedang ditangani").waitFor({ timeout: SLOW }).catch(() => {});        // hle.ts:2132
    const ditangani = rujukan()[0]?.[1];
    notes.push(`«Saya yang menangani» → ${ditangani}`);
    if (ditangani !== "UNDER_REVIEW") rec.verdict = "FAIL";
    const k2 = kartu(d).first();
    await k2.locator('select[name="hasil"]').selectOption({ label: "Tidak ada tindakan lanjutan" });         // KartuKeputusan.tsx:127-137 («Hasil», hle.ts:2164); hle.ts:2138
    await k2.locator('textarea[name="catatan"]').fill(PUTUS);                                              // KartuKeputusan.tsx:140-141; hle.ts:2165
    await k2.getByRole("button", { name: "Catat keputusan", exact: true }).click();                        // KartuKeputusan.tsx:143-145; hle.ts:2163
    // the answer's address is the same as after «Saya yang menangani» (pimpinan/actions.ts:66), so the move is awaited in the database
    for (let i = 0; i < 40 && rujukan()[0]?.[1] !== "DECIDED"; i++) await d.waitForTimeout(500);
    await kartu(d).first().getByText("Sudah diputuskan").waitFor({ timeout: SLOW }).catch(() => {});       // hle.ts:2133
    const diputus = await teks(kartu(d));
    const tombolSisa = await kartu(d).first().locator("button").count();
    rec.shots.push(await shot(d, "cr38-dekan-diputuskan"));
    const r3 = rujukan()[0] ?? [];
    const maju = audit("management_decision.advanced", idKeputusan, `and actor_person_id = '${dekanId}'`);
    const jalan = sql(`select coalesce(string_agg((summary->>'to_state') || ':' || coalesce(summary->>'outcome', '-'), ',' order by id), '') from public.audit_log
      where id > ${dulu} and action = 'management_decision.advanced' and target_id = '${idKeputusan}'`).trim();
    notes.push(`«Catat keputusan» → ${r3.slice(1).join(" | ")}; the card «${diputus.slice(0, 220)}», controls left ${tombolSisa}; advanced on the record by the dean ${maju} (${jalan})`);
    if (r3[1] !== "DECIDED" || r3[6] !== "NO_FURTHER_ACTION" || r3[7] !== people.dekan.name || r3[8] !== PUTUS || maju !== 2
        || jalan !== "UNDER_REVIEW:-,DECIDED:NO_FURTHER_ACTION" || !/Sudah diputuskan/.test(diputus) || !/Tidak ada tindakan lanjutan/.test(diputus)
        || !/Tercatat\. Keadaan keputusan ini sudah diperbarui\./.test(diputus) || tombolSisa !== 0) rec.verdict = "FAIL";  // hle.ts:2167; KartuKeputusan.tsx:94-110

    // 4. the referrer sees what became of it
    await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    const nanti = await teks(kartu(h));
    notes.push(`the head of department's card now «${nanti.slice(0, 160)}»`);
    if (!/Sudah diputuskan/.test(nanti) || !/Tidak ada tindakan lanjutan/.test(nanti)) rec.verdict = "FAIL";
    // W2.7 (Batch 5; CR-77, Daisy GQ2): and on the page she referred it from: Studio → «Tinjauan Integritas», under
    // «Sudah ditinjau», the observation carries the case's named steps, the outcome in words and the dean's note
    await h.goto(`${APP}/studio/integritas`, { waitUntil: "networkidle" });
    await h.getByRole("heading", { name: "Tinjauan Integritas", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
    const diStudio = await teks(h.locator(`[data-sinyal-ditinjau="${idSinyal}"]`));
    rec.shots.push(await shot(h, "cr77-perujuk-melihat-hasil"));
    notes.push(`CR-77: on Tinjauan Integritas the referred observation reads «${diStudio.slice(0, 260)}»`);
    if (!/Diteruskan ke pihak sekolah/.test(diStudio) || !/Diputuskan/.test(diStudio) || !/Keputusan: Tidak ada tindakan lanjutan/.test(diStudio)
        || !diStudio.includes(PUTUS) || !/Kasus ini selesai/.test(diStudio) || MENTAH.test(diStudio)) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(d, "cr38-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await hc.close();
    await dc.close();
  }
  // 5. nothing moved but the decision: the class's scores, and the observation's own row
  const skorAkhir = skor();
  const sidikAkhir = sidik();
  notes.push(`the class's scores unchanged ${skorAkhir === skorAwal}; the observation's row unchanged ${sidikAkhir === sidikAwal}`);
  if (skorAkhir !== skorAwal || sidikAkhir !== sidikAwal) rec.verdict = "FAIL";
  // 6. the student whose sitting it was: nothing of it on her home, her result, or /pimpinan
  const kk = kartuKelas.find((x) => x.nama === namaMurid);
  if (!kk) { rec.verdict = "FAIL"; notes.push(`no class card for ${namaMurid}`); return notes.join("; "); }
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await masukKartu(s, kk);
    const bocor = [];
    const jejak = [RUJUK, PUTUS, "Tinjauan integritas", "Diteruskan ke pihak sekolah", "Tidak ada tindakan lanjutan", "Saya yang menangani"].map((x) => x.toLowerCase());
    for (const jalur of ["/belajar", `/belajar/${tugasBab()}/hasil`, "/pimpinan"]) {
      await s.goto(`${APP}${jalur}`, { waitUntil: "networkidle" });
      await tutupTur(s);
      const t = norm(await bodyText(s)).toLowerCase();
      if (jejak.some((x) => t.includes(x))) bocor.push(jalur);
      if (jalur === "/pimpinan" && new URL(s.url()).pathname === "/pimpinan" && !(await s.locator(".pin-refusal").count())) bocor.push("/pimpinan opened");  // HalamanPenolakan.tsx:39
    }
    rec.shots.push(await shot(s, "cr38-murid"));
    notes.push(`${namaMurid} sees it on ${bocor.length ? bocor.join(", ") : "none of"} /belajar, her result and /pimpinan`);
    if (bocor.length) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    notes.push(`the student's check stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await sc.close();
  }
  return notes.join("; ");
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// INSERT AFTER step "S23r" (or, without it, after the jalankanC12 call), before step "S24". Must run before S26b, which
// revokes Pak Guru Budi's only role (submit_support_report refuses REPORT_NOT_STAFF without one).
// CR-44 (REL-13): «Laporkan masalah», walked. The teacher, on /mengajar, follows «Laporkan masalah» in the header to
// /lapor?dari=/mengajar, answers the three questions and presses «Kirim laporan»; «Laporan saya» says it was received.
// The school admin finds it on Konfigurasi → «Laporan masalah» and moves it to «Ditangani» with a next step; the
// reporter reads that; the platform admin finds it on her own Konfigurasi (tier 2) and moves it to «Selesai»; the
// reporter reads that too. Checked against support_reports (20261119100000) and its audit rows.
await step("S23l", "«Laporkan masalah»: the teacher reports a problem from /mengajar and «Laporan saya» says it was received; the school admin moves it to «Ditangani» on Konfigurasi → «Laporan masalah» with a next step, and the reporter reads it; the platform admin, who sees every school's reports, moves it to «Selesai», and the reporter reads that (CR-44: REL-13)", async (rec) => {
  const LAKUKAN = "Membuka Kelas 1A dari halaman Mengajar untuk melihat bukti kelas.";
  const HARAPAN = "Halaman Lihat bukti terbuka dengan angka kelas.";
  const TERJADI = "Halaman memuat lama sekali sebelum angka kelas muncul (laporan uji jalan CR-44).";
  const LANGKAH_SEKOLAH = "Admin sekolah sedang memeriksanya; jawaban paling lambat besok pagi.";
  const LANGKAH_PINTAR = "Sudah diperbaiki oleh tim PINTAR; silakan muat ulang halaman Mengajar.";
  const namaSd = sql(`select name from public.institutions where id='${ids.sd}'`).trim();
  const orang = (email) => sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${email}'`).trim();
  const adminId = orang(people.sdAdmin.email);
  const gladysId = orang(GLADYS);
  const dulu = Number(sql(`select coalesce(max(id), 0) from public.audit_log`).trim());
  // the report as the database holds it: id|status|reporter|role|school|page|stops a class|device attached|next step|handled by
  const laporan = () => sql(`select coalesce((select r.id || '|' || r.status::text || '|' || p.display_name || '|' || r.reporter_role::text || '|' ||
      coalesce(i.name, '-') || '|' || r.page || '|' || r.stops_class::text || '|' || (r.device is not null)::text || '|' || coalesce(r.next_step, '') || '|' ||
      coalesce(r.handled_by_person_id::text, '-')
    from public.support_reports r join public.persons p on p.id = r.reporter_person_id left join public.institutions i on i.id = r.institution_id
   where r.happened = '${TERJADI}' order by r.created_at desc limit 1), '')`).trim().split("|");
  const teks = async (loc) => norm(await loc.first().textContent().catch(() => ""));
  const notes = [];
  let id = "";
  const tc = await ctx();
  const t = await tc.newPage();
  // the reporter's own line on «Laporan saya»: its status and the next step written to them
  const bacaSaya = async () => {
    const li = t.locator("li.pin-lapor-satu").filter({ hasText: TERJADI });                             // lapor/saya/page.tsx:193, 198
    return { ada: await li.count(), status: await teks(li.locator("strong")),                           // :195; hle.ts:2785-2787
      langkah: await teks(li.locator("p.pin-lapor-langkah")) };                                         // :199-201; hle.ts:2782
  };
  // the triage on Konfigurasi, as the school admin or the platform admin: the report's line, moved on with a next step
  const pindahkan = async (page, ke, langkah) => {
    await page.goto(`${APP}/konfigurasi/laporan-masalah?muat=${Date.now()}#laporan-masalah`, { waitUntil: "networkidle" });
    await tutupTur(page);
    const li = page.locator(`#laporan-masalah li[data-laporan="${id}"]`);                              // konfigurasi/page.tsx:635, 648
    if (!(await li.count())) return { ada: false, bagian: await teks(page.locator("#laporan-masalah")) };
    const status = await teks(li.locator("[data-status-laporan]"));                                    // B1: the report's state badge
    const isi = await teks(li);
    // B1: the report's one action, «Ubah status», opens its short form in place first
    await li.locator("[data-buka-ubah]").click();
    await li.locator('select[name="status"]').waitFor({ timeout: SLOW });
    await li.locator('select[name="status"]').selectOption({ label: ke });                             // :670-673; hle.ts:2786-2787
    await li.locator('input[name="langkah"]').fill(langkah);                                           // :675-676
    await li.getByRole("button", { name: "Simpan", exact: true }).click();                              // :678; hle.ts:2799
    await page.waitForURL((u) => u.searchParams.get("bagian") === "laporan-masalah" && u.searchParams.has("lapor"), { timeout: SLOW }).catch(() => {});  // lapor/actions.ts:139, 150
    await page.waitForLoadState("networkidle");
    return { ada: true, status, isi, jawab: new URL(page.url()).searchParams.get("lapor"), kalimat: await teks(page.locator("#laporan-masalah")) };
  };
  try {
    // 1. the teacher reports it from the page it happened on
    await magicSignIn(t, people.guru.email);
    await t.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await tutupTur(t);
    await t.locator('a[data-lapor="1"]').first().click();                    // components/lapor/TautanLapor.tsx:18 (CangkangPengalaman.tsx:153); «Laporkan masalah», hle.ts:2756
    await t.waitForURL((u) => u.pathname === "/lapor", { timeout: SLOW });
    await t.locator('textarea[name="lakukan"]').waitFor({ timeout: SLOW });
    const dari = new URL(t.url()).searchParams.get("dari");
    const halaman = await teks(t.locator("form.pin-lapor .pin-meta"));    // lapor/page.tsx:48, 51-53; «Halaman:», hle.ts:2762
    await t.locator('textarea[name="lakukan"]').fill(LAKUKAN);            // lapor/page.tsx:55-57; «Apa yang Anda lakukan?», hle.ts:2764
    await t.locator('textarea[name="harapan"]').fill(HARAPAN);            // :59-61; «Apa yang Anda harapkan terjadi?», hle.ts:2765
    await t.locator('textarea[name="terjadi"]').fill(TERJADI);            // :63-65; «Apa yang terjadi?», hle.ts:2766
    rec.shots.push(await shot(t, "cr44-lapor"));
    await t.getByRole("button", { name: "Kirim laporan", exact: true }).click();   // :73; hle.ts:2775
    await t.waitForURL((u) => u.pathname === "/lapor/saya", { timeout: SLOW });    // lapor/actions.ts:130
    await t.waitForLoadState("networkidle");
    const diterima = (await t.getByText("Laporan Anda diterima. Statusnya dapat diikuti di sini.").count()) > 0;  // saya/page.tsx:187; hle.ts:2777
    const saya1 = await bacaSaya();
    rec.shots.push(await shot(t, "cr44-laporan-saya"));
    const r0 = laporan();
    id = r0[0] ?? "";
    const diterimaAudit = id ? Number(sql(`select count(*) from public.audit_log where id > ${dulu} and action = 'support_report.received' and target_id = '${id}' and institution_id = '${ids.sd}'`).trim()) : 0;
    notes.push(`«Laporkan masalah» from /mengajar → /lapor?dari=${dari}, the form says «${halaman}»; «Kirim laporan» → received said ${diterima}, «Laporan saya» reads ` +
      `«${saya1.status}» «${saya1.langkah}»; in the database ${r0.slice(1, 8).join(" | ")}, audited ${diterimaAudit}`);
    if (dari !== "/mengajar" || halaman !== "Halaman: Mengajar" ||   // RV-1 (D-140): the place in words, never its path
        !diterima || saya1.ada !== 1 || saya1.status !== "Diterima"
        || !saya1.langkah.includes("Admin sekolah atau tim PINTAR akan melihatnya dalam satu hari sekolah.")        // hle.ts:2783
        || r0[1] !== "DITERIMA" || r0[2] !== people.guru.name || r0[3] !== "EDUCATOR" || r0[4] !== namaSd || r0[5] !== "/mengajar"
        || r0[6] !== "false" || r0[7] !== "true" || diterimaAudit !== 1) { rec.verdict = "FAIL"; if (!id) return notes.join("; "); }

    // 2. the school admin (tier 1) moves it to «Ditangani» with the next step
    const p1 = await pindahkan(a, "Ditangani", LANGKAH_SEKOLAH);
    rec.shots.push(await shot(a, "cr44-admin-ditangani"));
    const r1 = laporan();
    notes.push(p1.ada ? `the school admin's «Laporan masalah» lists it «${p1.status}» with «${people.guru.name} · Guru · ${namaSd}» ${p1.isi.includes(`${people.guru.name} · Guru · ${namaSd}`)}, ` +
      `the three answers ${[LAKUKAN, HARAPAN, TERJADI].every((x) => p1.isi.includes(x))}; «Simpan» → lapor=${p1.jawab}; in the database ${r1[1]}, next step set ${r1[8] === LANGKAH_SEKOLAH}, by the school admin ${r1[9] === adminId}`
      : `the school admin's «Laporan masalah» does not list it: «${p1.bagian.slice(0, 200)}»`);
    if (!p1.ada || p1.status !== "Diterima" || !p1.isi.includes(`${people.guru.name} · Guru · ${namaSd}`) || !p1.isi.includes("/mengajar")   // konfigurasi/page.tsx:652, 655; role.EDUCATOR «Guru», hle.ts:3085
        || ![LAKUKAN, HARAPAN, TERJADI].every((x) => p1.isi.includes(x)) || p1.jawab !== "MOVED" || !p1.kalimat.includes("Status laporan diperbarui.")   // hle.ts:2801
        || r1[1] !== "DITANGANI" || r1[8] !== LANGKAH_SEKOLAH || r1[9] !== adminId) rec.verdict = "FAIL";

    // 3. the reporter reads the new status (by the address: no screen links to «Laporan saya», see the notes)
    await t.goto(`${APP}/lapor/saya`, { waitUntil: "networkidle" });
    const saya2 = await bacaSaya();
    notes.push(`«Laporan saya» now «${saya2.status}» «${saya2.langkah}»`);
    if (saya2.status !== "Ditangani" || !saya2.langkah.includes(LANGKAH_SEKOLAH)) rec.verdict = "FAIL";

    // 4. the platform admin (tier 2) sees it among every school's, and closes it
    // L3 (D-132 C7): every school's reports are «Seluruh platform»'s
    await keKonteks(g, { tujuan: "MENGELOLA", platform: true });
    const p2 = await pindahkan(g, "Selesai", LANGKAH_PINTAR);
    rec.shots.push(await shot(g, "cr44-gladys-selesai"));
    const r2 = laporan();
    notes.push(p2.ada ? `the platform admin's «Laporan masalah» lists it «${p2.status}» of ${namaSd} ${p2.isi.includes(namaSd)}; «Simpan» → lapor=${p2.jawab}; in the database ${r2[1]}, by the platform admin ${r2[9] === gladysId}`
      : `the platform admin's «Laporan masalah» does not list it: «${p2.bagian.slice(0, 200)}»`);
    if (!p2.ada || p2.status !== "Ditangani" || !p2.isi.includes(namaSd) || !p2.isi.includes(LANGKAH_SEKOLAH) || p2.jawab !== "MOVED"
        || r2[1] !== "SELESAI" || r2[8] !== LANGKAH_PINTAR || r2[9] !== gladysId) rec.verdict = "FAIL";

    // 5. the reporter reads that it is done
    await t.goto(`${APP}/lapor/saya`, { waitUntil: "networkidle" });
    const saya3 = await bacaSaya();
    rec.shots.push(await shot(t, "cr44-laporan-saya-selesai"));
    const pindahAudit = Number(sql(`select count(*) from public.audit_log where id > ${dulu} and action = 'support_report.moved' and target_id = '${id}' and institution_id = '${ids.sd}'`).trim());
    notes.push(`«Laporan saya» finally «${saya3.status}» «${saya3.langkah}»; moves audited ${pindahAudit}`);
    if (saya3.status !== "Selesai" || !saya3.langkah.includes(LANGKAH_PINTAR) || pindahAudit !== 2) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(t, "cr44-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await tc.close();
  }
  return notes.join("; ");
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// INSERT AFTER step "S23l" (or, without it, after the jalankanC12 call), before step "S24": the head of department reads
// the class summary, and S24 revokes that role.
// CR-40 (J3.9, ADM-17): a report template, walked to where it is used. Every school starts with PINTAR's standard class
// report (BOB-06, 20261011100000). The head of department opens Kelas 1A's summary from /pimpinan («Buka ringkasan kelas
// ini», as in S23) and reads the standard assembly; the school admin assembles the school's own class report on
// Konfigurasi → «Templat laporan» (two metrics, the last drawing each permits) with «Simpan templat»; the head of
// department reads the same summary again and it is the school's assembly: those two, in that order, from that template
// (generated_reports names the template each reading was drawn from). PINTAR's standard template is untouched.
await step("S23t", "the school admin assembles the school's own class report on Konfigurasi → «Templat laporan» («Simpan templat»); the head of department's Kelas 1A summary, opened from /pimpinan before and after, changes from PINTAR's standard assembly to exactly the school's (CR-40: J3.9, ADM-17)", async (rec) => {
  const kelas = kelasSatuA();
  const baku = sql(`select id from public.report_templates where institution_id='${ids.sd}' and standard_report='class_learning_intelligence' and is_standard`).trim();
  if (!kelas || !baku) { rec.verdict = "BLOCKED"; return !kelas ? "no Kelas 1A" : "SD has no standard class report (BOB-06)"; }
  // the school's own class template, if any: id|version|title key|made by|metric:drawing in order
  const sendiri = () => sql(`select coalesce((select t.id || '|' || t.template_version || '|' || t.title_key || '|' || coalesce(p.display_name, '-') || '|' ||
      coalesce((select string_agg(m.metric_id || ':' || m.visualization, ',' order by m.ordinal) from public.report_template_metrics m where m.template_id = t.id), '')
    from public.report_templates t left join public.persons p on p.id = t.created_by_person_id
   where t.institution_id='${ids.sd}' and t.standard_report='class_learning_intelligence' and not t.is_standard order by t.created_at desc limit 1), '')`).trim();
  // the screen makes only a first own template (version 1, no template chosen: see the notes); a walk that met one already says so
  if (sendiri()) { rec.verdict = "BLOCKED"; return `SD already has its own class report template (${sendiri()}); the screen offers no way to revise it`; }
  const isiBaku = () => sql(`select coalesce(string_agg(metric_id || ':' || visualization, ',' order by ordinal), '') from public.report_template_metrics where template_id='${baku}'`).trim();
  const bakuAwal = isiBaku();
  const kaprodiId = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${people.kaprodi.email}'`).trim();
  // the class report the head of department was last shown at Kelas 1A: template|version|entries|metrics in order (one withheld is unnamed)
  const terakhir = () => sql(`select coalesce((select r.template_id || '|' || r.template_version || '|' || jsonb_array_length(r.body->'entries') || '|' ||
      (select coalesce(string_agg(coalesce(e->>'metric_id', '(ditahan)'), ',' order by (e->>'ordinal')::int), '') from jsonb_array_elements(r.body->'entries') e)
    from public.generated_reports r where r.generated_by_person_id = '${kaprodiId}' and r.scope_node_id = '${kelas}' and r.standard_report = 'class_learning_intelligence'
   order by r.generated_at desc limit 1), '')`).trim().split("|");
  const PILIH = ["class.comprehension", "class.net_gain"];   // labels «Pemahaman», «Kenaikan» (Terminology v1)
  const notes = [];
  const hc = await ctx();
  const h = await hc.newPage();
  // the summary as drawn: one article per entry of the template, each permitted one headed by its label
  const bacaRingkasan = async () => {
    // W3.8 (Batch 5): «Ringkasan Kelas» is the eyebrow; the heading names the class
    await h.locator("main .pin-head .pin-eyebrow", { hasText: "Ringkasan Kelas" }).waitFor({ timeout: SLOW });
    await h.waitForLoadState("networkidle");
    return { n: await h.locator("main > section > article").count(),                                    // edukator/ringkasan/page.tsx:97-99
      judul: (await h.locator("main > section > article > h2").allTextContents()).map(norm) };           // :102-104
  };
  try {
    // 1. before: the head of department opens Kelas 1A's summary from /pimpinan (S23's path, journey.mjs:2145-2167)
    await magicSignIn(h, people.kaprodi.email);
    await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
    await tutupTur(h);
    const panel = h.locator("details.pin-kelas-bukti").filter({ has: h.locator("summary", { hasText: "Kelas 1A" }) }).first();   // pimpinan/page.tsx:234-240
    await panel.locator("summary").click();
    await panel.getByRole("link", { name: "Buka ringkasan kelas ini" }).click();                          // pimpinan/page.tsx:258-260; hle.ts:3006
    await h.waitForURL((u) => u.pathname === "/edukator/ringkasan", { timeout: SLOW });
    const alamat = h.url();
    const awal = await bacaRingkasan();
    const lapAwal = terakhir();
    rec.shots.push(await shot(h, "cr40-ringkasan-sebelum"));
    const nBaku = bakuAwal ? bakuAwal.split(",").length : 0;
    notes.push(`before: Kelas 1A's summary shows ${awal.n} entr(ies) ${JSON.stringify(awal.judul)}, drawn from PINTAR's standard template ${lapAwal[0] === baku} (its ${nBaku}: ${bakuAwal})`);
    if (lapAwal[0] !== baku || awal.n !== nBaku) rec.verdict = "FAIL";

    // 2. the school admin assembles the school's own class report
    await a.goto(`${APP}/konfigurasi/intelligence?muat=${Date.now()}#intelligence`, { waitUntil: "networkidle" });
    await tutupTur(a);
    const daftarSebelum = await a.locator("#intelligence ul > li").count();                            // konfigurasi/page.tsx:1144-1153
    const form = a.locator("#intelligence form").first();                                              // :1137, 1160
    await form.locator('select[name="institution"]').selectOption(ids.sd);                              // :1161-1164
    await form.locator('select[name="standard_report"]').selectOption("class_learning_intelligence");   // (D-140: the option's text is its words, the value the report's own)
    // RESTATED FOR D-140: the title is chosen from the report titles by their words (JUDUL_LAPORAN), never typed as a key
    await form.locator('select[name="title_key"]').selectOption("laporan.kelas.judul");
    const tampilan = {};
    const kataTampilan = {};
    // RESTATED FOR L4 (CR-85, D-127 Q5): the screen names a metric by its own label (metrik.*.label), its id secondary,
    // so the saved template is found in the list by those labels, read from the same form, instead of by raw metric ids
    const labelMetrik = {};
    for (const m of PILIH) {
      labelMetrik[m] = norm(await form.locator("label").filter({ has: a.locator(`select[name="metric[${m}]"]`) }).first()
        .evaluate((el) => el.querySelector("span")?.firstChild?.textContent ?? "").catch(() => "")) || m;
    }
    for (const m of PILIH) {
      const pilih = form.locator(`select[name="metric[${m}]"]`);                                       // :1188-1191; "" = left out
      const pilihan = (await pilih.locator("option").evaluateAll((os) => os.map((o) => [o.value, (o.textContent ?? "").trim()]))).filter(([v]) => v);
      tampilan[m] = pilihan.at(-1)?.[0] ?? "";
      // D-140: the list names the drawing by its words (the option's own text), not its value
      kataTampilan[m] = pilihan.at(-1)?.[1] ?? "";
      if (tampilan[m]) await pilih.selectOption(tampilan[m]);
    }
    rec.shots.push(await shot(a, "cr40-templat-isi"));
    await form.getByRole("button", { name: "Simpan templat", exact: true }).click();                    // :1195; hle.ts:2542
    await a.waitForURL((u) => u.searchParams.get("bagian") === "intelligence" && u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});  // konfigurasi/actions.ts:24-25, 264
    await a.waitForLoadState("networkidle");
    const u = new URL(a.url());
    const bagian = norm(await a.locator("#intelligence").textContent().catch(() => ""));
    const daftarSesudah = await a.locator("#intelligence ul > li").count();
    rec.shots.push(await shot(a, "cr40-templat-disimpan"));
    const milik = sendiri().split("|");
    const harapIsi = PILIH.map((m) => `${m}:${tampilan[m]}`).join(",");
    const barisDaftar = PILIH.map((m) => `${labelMetrik[m]} (${kataTampilan[m]})`).join(", ");        // konfigurasi/page.tsx, «Templat laporan» (D-140: in words)
    const diaudit = milik[0] ? Number(sql(`select count(*) from public.audit_log where action = 'report_template.saved' and target_id = '${milik[0]}' and institution_id = '${ids.sd}'`).trim()) : 0;
    notes.push(`«Simpan templat» → hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")} n=${u.searchParams.get("n")}; the section lists ${daftarSebelum} → ${daftarSesudah} template(s), ` +
      `the new one «${barisDaftar}» ${bagian.includes(barisDaftar)}; in the database ${milik.slice(1).join(" | ") || "nothing"}, audited ${diaudit}`);
    if (u.searchParams.get("hasil") !== "ok" || u.searchParams.get("kode") !== "TEMPLATE_SAVED" || u.searchParams.get("n") !== String(PILIH.length)
        || !bagian.includes(`Metrik dalam templat laporan ini: ${PILIH.length}.`) || daftarSesudah !== daftarSebelum + 1 || !bagian.includes(barisDaftar)   // hle.ts:3516
        || milik[1] !== "1" || milik[2] !== "laporan.kelas.judul" || milik[3] !== people.sdAdmin.name || milik[4] !== harapIsi || diaudit !== 1) {
      rec.verdict = "FAIL";
      return notes.join("; ");
    }

    // 3. after: the same summary, read again, is the school's own assembly
    await h.goto(alamat, { waitUntil: "networkidle" });
    const akhir = await bacaRingkasan();
    const lapAkhir = terakhir();
    rec.shots.push(await shot(h, "cr40-ringkasan-sesudah"));
    const bakuAkhir = isiBaku();
    notes.push(`after: the summary shows ${akhir.n} entr(ies) ${JSON.stringify(akhir.judul)} from the school's own template ${lapAkhir[0] === milik[0]} ` +
      `(version ${lapAkhir[1]}, ${lapAkhir[3]}); PINTAR's standard template unchanged ${bakuAkhir === bakuAwal}`);
    if (lapAkhir[0] !== milik[0] || lapAkhir[1] !== "1" || lapAkhir[3] !== PILIH.join(",") || akhir.n !== PILIH.length
        || JSON.stringify(akhir.judul) !== JSON.stringify(["Pemahaman", "Kenaikan"]) || bakuAkhir !== bakuAwal) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(h, "cr40-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await hc.close();
  }
  return notes.join("; ");
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// INSERT AFTER step "S23t" (or anywhere after the jalankanC12 call; read only, it changes nothing). Last of the block so
// the trail it reads holds S23r's, S23l's and S23t's rows.
// CR-39 (J1.6, SYS-07): the audit reader, walked. Konfigurasi → «Jejak audit» (#audit) lists the newest 50 audit rows
// the reader may see (konfigurasi/page.tsx:124, 134): the school admin's are asked for their own school only; the
// platform admin's are not filtered. Each reader's table is compared with the database's newest 50 for the same
// filter; the school admin's carries no row of another school or of none, the platform admin's carries rows beyond SD.
await step("S23j", "the audit reader: on Konfigurasi → «Jejak audit» the school admin reads exactly their own school's newest 50 audit rows and none of another school's; the platform admin reads the platform's newest 50, across schools (CR-39: J1.6, SYS-07)", async (rec) => {
  const namaSd = sql(`select name from public.institutions where id='${ids.sd}'`).trim();
  // a reader's «Jejak audit», row by row: action|table|the target's first 8 characters|school (empty when the row names none)
  const bacaJejak = async (page, nama) => {
    await page.goto(`${APP}/konfigurasi/audit?muat=${Date.now()}#audit`, { waitUntil: "networkidle" });
    await tutupTur(page);
    await page.locator("#audit table").waitFor({ timeout: SLOW });                                    // konfigurasi/page.tsx:1106-1110; «Jejak audit», hle.ts:2625
    rec.shots.push(await shot(page, nama));
    // RESTATED FOR D-140 (Jejak audit in words, DG-11): the row is (when, the action in words, the record's kind ·
    // its school), plus the build only in «Seluruh platform»; the empty line is one cell. No code, table or id is shown.
    const baris = await page.locator("#audit tbody tr").evaluateAll((trs) => trs
      .filter((tr) => tr.children.length >= 3)
      .map((tr) => [...tr.children].map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim())));
    return baris.map(([, aksi, sasaran]) => {
      const bagian = sasaran === "\u2014" ? [] : sasaran.split(" · ");
      // the record's kind is named only when the copy table has it; the school is the last part when the row has one
      const sekolah = bagian.length && sekolahKenal.has(bagian[bagian.length - 1]) ? bagian.pop() : "";
      return `${aksi}|${bagian.join(" · ")}|${sekolah}`;
    });
  };
  const sekolahKenal = new Set(sql("select name from public.institutions").split("\n").filter(Boolean));
  // the words the page itself prints for each (action, table), from the same mapping (src/lib/jejak-audit.ts)
  const kataUntuk = (pasangan) => {
    const keluar = execFileSync("npx", ["tsx", "-e",
      "import { kataAksiAudit, kataTabelAudit } from './src/lib/jejak-audit.ts';" +
      "const p = JSON.parse(process.env.PASANGAN);" +
      "process.stdout.write(JSON.stringify(p.map(([a, t]) => [kataAksiAudit(a, 'id'), kataTabelAudit(t, 'id') ?? ''])));"],
      { cwd: process.env.APP_DIR, encoding: "utf8", env: { ...process.env, PASANGAN: JSON.stringify(pasangan) } });
    return JSON.parse(keluar);
  };
  // the database's newest 50 for the same filter, newest first; the rows sharing the 50th row's moment (one transaction
  // writes several) may fall either side of the cut, so they are allowed on the screen, not required
  const harapan = (saring) => {
    const baris = sql(`with t as (select l.at from public.audit_log l where ${saring} order by l.at desc limit 50)
      select coalesce(string_agg(l.action || '|' || l.target_table || '|' || coalesce(left(l.target_id, 8), '') || '|' || coalesce(i.name, '') || '#' ||
             (l.at > (select min(at) from t))::text, chr(10)), '')
        from public.audit_log l left join public.institutions i on i.id = l.institution_id
       where ${saring} and l.at >= (select min(at) from t)`).split("\n").filter(Boolean);
    // each database row as the page words it: action|kind|school
    const pasangan = baris.map((b) => b.split("|").slice(0, 2));
    const kata = pasangan.length ? kataUntuk(pasangan) : [];
    const dikata = baris.map((b, i) => { const [, , , rest] = b.split("|"); return `${kata[i][0]}|${kata[i][1]}|${rest}`; });
    return {
      semua: Number(sql(`select count(*) from public.audit_log l where ${saring}`).trim()),
      pasti: dikata.filter((b) => b.endsWith("#true")).map((b) => b.replace(/#true$/, "")),
      boleh: dikata.map((b) => b.replace(/#(true|false)$/, "")),
      kode: baris.map((b) => b.split("|")[0]),
    };
  };
  const ganda = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
  const dalam = (kecil, besar) => { const b = ganda(besar); return [...ganda(kecil)].every(([x, n]) => (b.get(x) ?? 0) >= n); };
  const sama = (layar, hr) => layar.length === Math.min(50, hr.semua) && dalam(hr.pasti, layar) && dalam(layar, hr.boleh);
  const sekolahDi = (xs) => [...new Set(xs.map((k) => k.split("|")[3] || "(no school)"))];
  // the school admin: read, then asked of the database at once (nothing runs between)
  const layarAdmin = await bacaJejak(a, "cr39-jejak-admin");
  const hAdmin = harapan(`l.institution_id = '${ids.sd}'`);
  // the platform admin, in «Seluruh platform» (L3, D-132 C7: the platform's audit)
  await keKonteks(g, { tujuan: "MENGELOLA", platform: true });
  const layarGladys = await bacaJejak(g, "cr39-jejak-gladys");
  const hGladys = harapan("true");
  const asingAdmin = layarAdmin.filter((k) => !k.endsWith(`|${namaSd}`));
  const diluarSd = layarGladys.filter((k) => !k.endsWith(`|${namaSd}`));
  const langkahIni = ["management_decision.advanced", "support_report.moved", "report_template.saved"].filter((x) => hAdmin.kode.includes(x));
  // nothing on the screen is a code: no action, table or id leaks (D-140(c))
  const bocor = [...layarAdmin, ...layarGladys].filter((k) => /[a-z]+_[a-z_]+|[A-Z]{3,}_[A-Z_]+|\b[0-9a-f]{8}\b/.test(k));
  if (bocor.length) rec.verdict = "FAIL";
  const okAdmin = layarAdmin.length > 0 && sama(layarAdmin, hAdmin) && asingAdmin.length === 0;
  const okGladys = sama(layarGladys, hGladys) && diluarSd.length > 0;
  if (!okAdmin || !okGladys) rec.verdict = "FAIL";
  return `the school admin's «Jejak audit»: ${layarAdmin.length} row(s) (the database's newest for SD: ${Math.min(50, hAdmin.semua)} of ${hAdmin.semua}), the same rows ${sama(layarAdmin, hAdmin)}, ` +
    `schools named ${JSON.stringify(sekolahDi(layarAdmin))}, rows of another school or of none ${asingAdmin.length}${asingAdmin.length ? ` (${asingAdmin.slice(0, 3).join(", ")})` : ""}; ` +
    `this block's own rows among them: ${langkahIni.join(", ") || "none"}; the platform admin's: ${layarGladys.length} row(s) (the database's newest overall: ${Math.min(50, hGladys.semua)} of ${hGladys.semua}), ` +
    `the same rows ${sama(layarGladys, hGladys)}, schools named ${JSON.stringify(sekolahDi(layarGladys))}, rows beyond SD ${diluarSd.length}; ` +
    `the actions as printed: ${JSON.stringify([...new Set(layarAdmin.map((k) => k.split("|")[0]))].slice(0, 8))}; codes on screen ${bocor.length}${bocor.length ? ` (${bocor.slice(0, 3).join(", ")})` : ""}`;
});

// CR-52 (J4.8 EC; D-050(a)(d)): the Question Bank, walked against QN5 as D-120 ruled it: «4.0's Question Bank means
// browse, filter and review with the answer key and reason; no additional authoring workflow». Read only; before S24,
// which revokes the head of department. The head of department reviews question health (CAN_REVIEW_QUESTION_HEALTH,
// role_capabilities, 20260912004158:59-60) and reaches Studio → «Bank Soal» by clicking (studio/layout.tsx:53).
// Each of QN5's four parts is recorded on its own and judged as QN5 words it. Whether a chapter's package page, where
// the reviewer reads every question with its key and reason (D-088(h), S17), counts as the bank's review is the
// owner's call, not this step's: the step says whether the bank shows them or leads to them.
await step("S23q", "the Question Bank as QN5 rules it (CR-52): the head of department opens Studio → «Bank Soal» by clicking; browse (the school's questions, no other school's), filter (a way to narrow the list), review with the answer key and reason (on the bank, or a link from a question to them), and no authoring on the bank", async (rec) => {
  const hc = await ctx();
  const h = await hc.newPage();
  const notes = [];
  try {
    await magicSignIn(h, people.kaprodi.email);
    // L3 (D-132 C4, C8): she holds Mengajar and Mengelola at SD, so Studio asks which; Bank Soal is Mengelola's
    await keKonteks(h, { tujuan: "MENGELOLA", nama: "SD Zayd" });
    await h.goto(`${APP}/studio`, { waitUntil: "networkidle" });
    await tutupTur(h);
    await h.getByRole("link", { name: "Bank Soal" }).first().click();                                  // studio/layout.tsx:53; hle.ts:3300
    await h.waitForURL((u) => u.pathname === "/studio/bank", { timeout: SLOW });
    await h.waitForLoadState("networkidle");
    await tutupTur(h);
    await h.getByRole("heading", { name: "Bank Soal", exact: true }).waitFor({ timeout: SLOW });        // studio/bank/page.tsx:73; hle.ts:3479
    rec.shots.push(await shot(h, "cr52-bank-soal"));

    // 1. BROWSE: every listed question is one of SD's; the newest 40 of SD's at least (bank/page.tsx:50, li[data-soal] :86)
    const layar = await h.locator("li[data-soal]").evaluateAll((ls) => ls.map((l) => l.getAttribute("data-soal") ?? ""));
    const pemilik = new Map(sql(`select coalesce(string_agg(left(i.id::text, 8) || '|' || coalesce(n.slug, '-') || '|' || coalesce(n.tenant_kind::text, '-'), chr(10)), '')
      from public.items i left join public.institutions n on n.id = i.institution_id`).split("\n").filter(Boolean).map((b) => { const [k, slug, jenis] = b.split("|"); return [k, { slug, jenis }]; }));
    const slugSd = sql(`select slug from public.institutions where id='${ids.sd}'`).trim();
    const nSd = Number(sql(`select count(*) from public.items where institution_id='${ids.sd}'`).trim());
    const milikSd = layar.filter((k) => pemilik.get(k)?.slug === slugSd).length;
    const sekolahLain = layar.filter((k) => { const p = pemilik.get(k); return p && p.slug !== slugSd && p.jenis === "INSTITUTION"; });
    const pustaka = layar.filter((k) => pemilik.get(k)?.jenis === "PLATFORM_CANONICAL").length;
    const telusur = layar.length > 0 && milikSd >= Math.min(40, nSd) && sekolahLain.length === 0;
    notes.push(`browse: ${layar.length} question(s) listed, ${milikSd} of them SD's (SD holds ${nSd}; the page lists the newest 40 and every one waiting on a reviewer), ` +
      `${sekolahLain.length} of another school${sekolahLain.length ? ` (${sekolahLain.slice(0, 3).map((k) => pemilik.get(k)?.slug).join(", ")})` : ""}, ${pustaka} of the PINTAR library; no paging (${nSd > 40 ? `${nSd - 40} older question(s) not reachable here` : "all fit"})`);

    // 2. FILTER: a control that narrows the list: a search or text field, a select or a link that is not a question's
    //    review form (each review form carries input[name=soal], :99), or a query string the page reads to narrow it
    //    (a form with no field of its own, such as signing out, narrows nothing and is not counted)
    const kendali = (await h.locator("main form").evaluateAll((fs) => fs.filter((f) => !f.querySelector("input[name=soal]"))
      .map((f) => [...f.querySelectorAll("input:not([type=hidden]):not([type=submit]), select, textarea")].map((x) => x.getAttribute("name") ?? x.tagName.toLowerCase()).join(","))))
      .filter((f) => f.length > 0);
    const cari = await h.locator("main input[type=search], main [role=search]").count();
    const saringan = await h.locator("main a[href*='/studio/bank?']").count();
    const ada = kendali.length + cari + saringan;
    notes.push(`filter: ${ada} control(s) on the bank (forms other than a question's review: ${kendali.length}${kendali.length ? ` ${JSON.stringify(kendali)}` : ""}; search fields ${cari}; narrowing links ${saringan})`);

    // 3. REVIEW WITH KEY AND REASON: on the bank, or one link from a question to them (the package page marks the key
    //    li.pin-opsi-kunci and gives each option its reason li.pin-opsi, studio/paket/[course]/page.tsx:256-262)
    const kunciDiBank = await h.locator("li[data-soal] .pin-opsi-kunci").count();
    const alasanDiBank = await h.locator("li[data-soal] .pin-opsi").count();
    const keSoal = await h.locator("li[data-soal] a[href]").count();
    notes.push(`review: on the bank ${kunciDiBank} key(s) and ${alasanDiBank} option(s) with a reason are shown; ${keSoal} link(s) from a question to anywhere; ` +
      `each listed question shows its text, its bank and its predicted difficulty (:89-94). A chapter's package page shows every question with its key and reason (D-088(h), S17), reached from the chapter, not from the bank`);

    // 4. NO AUTHORING: nothing on the bank writes a question; its forms are a question's health review (:96-109)
    const tulis = await h.locator("main textarea, main input[name=stem], main input[name=opsi], main input[name=kunci]").count();
    const tombolTulis = await h.locator("main button, main a").filter({ hasText: /tambah soal|buat soal|ubah soal|sunting soal/i }).count();
    const tanpaTulis = tulis === 0 && tombolTulis === 0;
    const caraUbah = /unggah buku kerja yang sudah diperbaiki/i.test(await bodyText(h));                // hle.ts:3481, «Untuk mengubah soal …»
    notes.push(`no authoring: ${tanpaTulis ? "nothing on the bank writes a question" : `${tulis} writing field(s), ${tombolTulis} control(s) offering to write a question`}; the page says a question is changed by a corrected workbook: ${caraUbah}`);

    // the verdict, as QN5 words it: all four parts on the bank
    const kurang = [];
    if (!telusur) kurang.push("browse");
    if (ada === 0) kurang.push("filter");
    if (kunciDiBank === 0 && keSoal === 0) kurang.push("review with the answer key and reason");
    if (!tanpaTulis) kurang.push("no authoring");
    if (kurang.length) rec.verdict = "FAIL";
    notes.push(kurang.length ? `QN5 not met on the bank: ${kurang.join(", ")}` : "QN5 met on the bank");
  } finally {
    await hc.close();
  }
  return notes.join("; ");
});

await step("S24", "the school admin revokes the head of department's role on Konfigurasi → Peran & akses; the head of department is then refused /pimpinan (ADM-J14)", async (rec) => {
  await a.goto(`${APP}/konfigurasi/roles#roles`, { waitUntil: "networkidle" });
  const baris = a.locator("#roles li").filter({ hasText: "Kepala departemen" }).filter({ hasText: "Kelas Rendah" }).first();
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "adm-j14-peran"));
    return `no «Kepala departemen · Kelas Rendah» row on Peran & akses: ${norm(await a.locator("#roles").innerText().catch(() => "")).slice(0, 300)}`;
  }
  // D-097(a): a revocation states why
  // B1: a record's one action opens its short form in place first
  await baris.locator("[data-buka-ubah]").click();
  await baris.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await baris.locator('input[name="alasan"]').fill("Tidak lagi memimpin Kelas Rendah");
  await baris.getByRole("button", { name: "Cabut", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "roles" && u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await a.waitForLoadState("networkidle");
  rec.shots.push(await shot(a, "adm-j14-dicabut"));
  const u = new URL(a.url());
  const masih = await a.locator("#roles li").filter({ hasText: "Kepala departemen" }).filter({ hasText: "Kelas Rendah" }).count();
  const hc = await ctx();
  const h = await hc.newPage();
  await magicSignIn(h, people.kaprodi.email);
  await h.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
  const ditolak = (await h.locator(".pin-refusal").count()) > 0;
  rec.shots.push(await shot(h, "adm-j14-kaprodi-ditolak"));
  const teks = norm(await bodyText(h)).slice(0, 200);
  await hc.close();
  if (u.searchParams.get("hasil") !== "ok" || masih > 0 || !ditolak) rec.verdict = "FAIL";
  return `after «Cabut»: hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")}; the row still listed ${masih > 0}; ` +
    `the head of department on /pimpinan refused ${ditolak}: "${teks}"`;
});

// M9 (D-085; J3.12, ADM-J13): the school admin makes Kelas 1B on the Struktur
// sekolah screen, then moves the fifth student there from Kelas 1A on
// Konfigurasi → «Pindah kelas». They stay one person; their Bab 1 sessions stay
// recorded in Kelas 1A; Kelas 1A's teacher no longer has them on the roster or
// in «Mengumpulkan».
await step("S25", "the school admin moves a student from Kelas 1A to a new Kelas 1B on Konfigurasi → Pindah kelas; Kelas 1A's teacher no longer counts them or stands over them, and what they did stays with Kelas 1A (M9, ADM-J13, D-088(i))", async (rec) => {
  if (!HARAP) { rec.verdict = "BLOCKED"; return "the chapter fixture is absent"; }
  const kelas = kelasSatuA();
  const nama = MURID[4];
  await a.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  await tambahDi(a, "kelas", "Kelas 1B");
  const satuB = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1B' and is_active limit 1`).trim();
  if (!satuB) { rec.verdict = "FAIL"; return "Kelas 1B could not be made on the Struktur sekolah screen"; }
  // D-088(i): before the move, Kelas 1A's teacher stands over Eka (the governed read his own session makes)
  const ekaId = sql(`select p.id from public.persons p join public.institutional_identities ii on ii.person_id = p.id where p.display_name='${nama}' and ii.institution_id='${ids.sd}' limit 1`).trim();
  const budiApi = await apiSession(people.guru.email);
  const bacaGuru = async () => {
    const r = await budiApi.rpc("metric_evaluate", { p_metric_id: "learner.result", p_node: ekaId, p_institution: ids.sd });
    return r.error ? `error ${r.error.code}` : (r.data?.status ?? "ok");
  };
  const guruSebelum = await bacaGuru();
  await a.goto(`${APP}/konfigurasi/pindah#pindah`, { waitUntil: "networkidle" });
  const dari = a.locator("#pin-pindah-dari");
  if (!(await dari.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "m9-tanpa-pindah"));
    return `no «Pindah kelas» on Konfigurasi: ${norm(await a.locator("#pindah").innerText().catch(() => "(no section)")).slice(0, 200)}`;
  }
  const opsiA = (await dari.locator("option").allTextContents()).find((o) => o.startsWith("Kelas 1A"));
  await dari.selectOption({ label: opsiA });
  await a.locator("#pindah").getByRole("button", { name: "Tampilkan murid", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("dari") === kelas, { timeout: SLOW });
  await a.waitForLoadState("networkidle");
  const sebelum = norm(await a.locator("#pindah ul").first().innerText().catch(() => ""));
  const baris = a.locator("#pindah li").filter({ hasText: nama }).first();
  const opsiB = (await baris.locator('select[name="kelas"] option').allTextContents()).find((o) => o.startsWith("Kelas 1B"));
  await baris.locator('select[name="kelas"]').selectOption({ label: opsiB });
  await baris.getByRole("button", { name: `Pindahkan · ${nama}`, exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "pindah" && u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await a.waitForLoadState("networkidle");
  rec.shots.push(await shot(a, "m9-pindah-kelas"));
  const u = new URL(a.url());
  const sesudah = norm(await a.locator("#pindah").innerText().catch(() => ""));
  // one person; the 1A placement closed with MOVED and 1B open; the sessions where they were sat
  const orang = sql(`select count(*) from public.persons p join public.institutional_identities ii on ii.person_id = p.id where p.display_name='${nama}' and ii.institution_id='${ids.sd}'`).trim();
  const tempat = sql(`select string_agg(n.name || ':' || coalesce(m.close_reason::text, 'open'), ',' order by m.valid_from, m.valid_to nulls last) from public.memberships m join public.enrollments e on e.id = m.enrollment_id join public.persons p on p.id = e.person_id join public.org_nodes n on n.id = m.node_id where p.display_name='${nama}' and n.kind='CLASS' and n.institution_id='${ids.sd}'`).trim();
  const sesi = sql(`select coalesce(string_agg(distinct coalesce(n.name, '-'), ','), '') from public.assessment_sessions s join public.persons p on p.id = s.person_id left join public.org_nodes n on n.id = s.class_node_id where p.display_name='${nama}'`).trim();
  // Kelas 1A's teacher: the roster and «Mengumpulkan» count the class without them
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru.email);
  await t.goto(`${APP}/mengajar/${kelas}`, { waitUntil: "networkidle" });
  await tutupTur(t);
  const roster = norm(await t.locator("#pin-kelas-murid").first().innerText().catch(() => ""));
  await t.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
  await tutupTur(t);
  rec.shots.push(await shot(t, "m9-guru-bukti"));
  const kumpul = [...(await bodyText(t)).matchAll(/Mengumpulkan\s*(\d+)\s*\/\s*(\d+)/gi)].map((m) => `${m[1]}/${m[2]}`);
  // D-088(i): after it, her former teacher no longer stands over her: her record under Kelas 1A is refused, and
  // the governed read itself (his own session) answers not_permitted. What she did stays in 1A's figures.
  await t.goto(`${APP}/mengajar/${kelas}/murid/${ekaId}`, { waitUntil: "networkidle" });
  const halTolak = (await t.locator(".pin-refusal").count()) > 0;
  const guruSesudah = await bacaGuru();
  await tc.close();
  const sisa = `${MURID.length - 1}/${MURID.length - 1}`;
  const ok = u.searchParams.get("hasil") === "ok" && u.searchParams.get("dari") === satuB && sesudah.includes(nama)
    && orang === "1" && tempat === "Kelas 1A:MOVED,Kelas 1B:open" && sesi === "Kelas 1A"
    && roster.length > 0 && !roster.includes(nama) && kumpul.length > 0 && kumpul.every((k) => k === sisa)
    && guruSebelum !== "not_permitted" && guruSesudah === "not_permitted" && halTolak;
  if (!ok) rec.verdict = "FAIL";
  return `Kelas 1A on «Pindah kelas»: "${sebelum.slice(0, 120)}"; after «Pindahkan»: hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")}, ` +
    `showing ${u.searchParams.get("dari") === satuB ? "Kelas 1B" : u.searchParams.get("dari")} with ${nama}: ${sesudah.includes(nama)}; ` +
    `persons named ${nama} at SD: ${orang}; Kelas placements: ${tempat}; sessions recorded in: ${sesi}; ` +
    `1A's roster still names ${nama}: ${roster.includes(nama)}; «Mengumpulkan» on 1A's Lihat bukti: ${JSON.stringify(kumpul)} (expected ${sisa}); ` +
    `D-088(i): 1A's teacher reading ${nama}'s result before the move: ${guruSebelum}, after: ${guruSesudah} (expected not_permitted); her record under 1A refused: ${halTolak}`;
});

// ADM-J20: a setup mistake corrected on the Struktur sekolah screen, whose rename and deactivate had never
// been clicked. The school admin tries to deactivate Kelas 1B while a student is in it (refused, with the
// reason and the way on), then renames it.
await step("S26", "the school admin corrects the structure on Struktur sekolah: deactivating a Kelas with a student in it is refused with the reason, and renaming it works (ADM-J20)", async (rec) => {
  const satuB = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 1B' limit 1`).trim();
  if (!satuB) { rec.verdict = "BLOCKED"; return "no Kelas 1B (S25)"; }
  await a.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  const baris = () => a.locator("#struktur .pin-str-baris").filter({ has: a.locator("strong.pin-str-nama", { hasText: /^Kelas 1B$/ }) }).first();
  if (!(await baris().count())) { rec.verdict = "FAIL"; return `Kelas 1B is not on Struktur sekolah: ${norm(await a.locator("#struktur").innerText().catch(() => "")).slice(0, 200)}`; }
  // deactivate, with a student placed there: the question first, then the refusal with its reason
  await baris().getByRole("button", { name: "Nonaktifkan", exact: true }).click();
  const tanya = norm(await a.locator("#struktur form.pin-str-tanya").first().innerText().catch(() => ""));
  // D-097(a): a deactivation states why
  await a.locator("#struktur form.pin-str-tanya").first().locator('input[name="alasan"]').fill("Digabung dengan Kelas 1A");
  await a.locator("#struktur form.pin-str-tanya").first().getByRole("button", { name: "Ya, nonaktifkan", exact: true }).click();
  await a.waitForFunction(() => /Masih ada murid di sini/.test(document.querySelector("#struktur")?.textContent ?? ""), null, { timeout: SLOW }).catch(() => {});
  const tolak = norm(await a.locator("#struktur").innerText().catch(() => ""));
  const masihAktif = sql(`select is_active from public.org_nodes where id='${satuB}'`).trim() === "t";
  rec.shots.push(await shot(a, "adm-j20-nonaktif-ditolak"));
  // the question stays open with the reason; the admin closes it with «Batal», as a person would (a jump to
  // the same #struktur address does not reload the page, so the row would stay on its question)
  const batal = a.locator("#struktur form.pin-str-tanya").first().getByRole("button", { name: "Batal", exact: true });
  if (await batal.count()) await batal.click();
  else await a.reload({ waitUntil: "networkidle" });
  // rename
  await baris().getByRole("button", { name: "Ubah nama", exact: true }).click();
  await a.locator(`#str-ubah-${satuB}`).fill("Kelas 1 Biru");
  await a.locator("#struktur form.pin-str-ubah").first().getByRole("button", { name: "Simpan", exact: true }).click();
  for (let i = 0; i < 30; i++) {
    if (sql(`select name from public.org_nodes where id='${satuB}'`).trim() === "Kelas 1 Biru") break;
    await a.waitForTimeout(500);
  }
  // the database has the new name; wait for the screen to show it (the action's response re-renders the panel;
  // waitForLoadState returns at once on a page already loaded). Never showing it stays a FAIL.
  await a.waitForFunction(() => /Kelas 1 Biru/.test(document.querySelector("#struktur")?.textContent ?? ""), null, { timeout: SLOW }).catch(() => {});
  const nama = sql(`select name from public.org_nodes where id='${satuB}'`).trim();
  const layar = norm(await a.locator("#struktur").innerText().catch(() => ""));
  rec.shots.push(await shot(a, "adm-j20-ubah-nama"));
  const ok = /Nonaktifkan Kelas Kelas 1B\?|Kelas 1B\?/.test(tanya) && /Masih ada murid di sini\. Pindahkan mereka dulu\./.test(tolak) && masihAktif
    && nama === "Kelas 1 Biru" && /Kelas 1 Biru/.test(layar);
  if (!ok) rec.verdict = "FAIL";
  return `the question: "${tanya.slice(0, 120)}"; after «Ya, nonaktifkan» with Eka placed there: the reason shown ${/Masih ada murid di sini/.test(tolak)}, still active ${masihAktif}; ` +
    `renamed to "${nama}", shown on the screen ${/Kelas 1 Biru/.test(layar)}`;
});

// ADM-J15: a new teacher replaces the old one mid-year, by the school's own screens: Bu Guru Sari is recorded
// by name on Pendataan, gets an account by email on Aktivasi and Guru at Kelas 1A on Peran & akses; Pak Guru
// Budi's Guru at Kelas 1A is revoked there. Sari finds Kelas 1A with its students and the figures of what
// was done there before her (the class continues); Budi is refused the class.
await step("S26b", "a new teacher replaces the old one mid-year: the school admin adds Bu Guru Sari and gives her Kelas 1A, then revokes Pak Guru Budi there; Sari finds the class and its history, Budi is refused (ADM-J15)", async (rec) => {
  if (!HARAP) { rec.verdict = "BLOCKED"; return "the chapter fixture is absent"; }
  const kelas = kelasSatuA();
  const jejak = [await catatLewatLayar(a, [people.guru2.name], rec.shots, { kelas: null, peran: null })];
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  const baris = a.locator("li.pin-akt-orang", { hasText: people.guru2.name }).first();
  if (!(await baris.count())) { rec.verdict = "FAIL"; return `${jejak.join(" | ")}; ${people.guru2.name} is not on Aktivasi`; }
  await baris.locator('input[type="email"]').fill(people.guru2.email);
  await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
  await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  const g = await grantViaForm(a, people.guru2.name, "EDUCATOR", "Kelas 1A");
  jejak.push(`Sari: Guru at Kelas 1A ${g.ok}`);
  // revoke Budi's Guru at Kelas 1A
  await a.goto(`${APP}/konfigurasi/roles?muat=${Date.now()}#roles`, { waitUntil: "networkidle" });
  const lama = a.locator("#roles li").filter({ hasText: people.guru.name }).filter({ hasText: "Guru" }).filter({ hasText: "Kelas 1A" }).first();
  if (!(await lama.count())) { rec.verdict = "FAIL"; return `${jejak.join(" | ")}; no «${people.guru.name} · Guru · Kelas 1A» row on Peran & akses`; }
  // B1: a record's one action opens its short form in place first
  await lama.locator("[data-buka-ubah]").click();
  await lama.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await lama.locator('input[name="alasan"]').fill("Digantikan Bu Guru Sari");   // D-097(a)
  await lama.getByRole("button", { name: "Cabut", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "roles" && u.searchParams.get("kode") === "ROLE_REVOKED", { timeout: SLOW }).catch(() => {});
  jejak.push(`Budi revoked: ${new URL(a.url()).searchParams.get("kode")}`);
  rec.shots.push(await shot(a, "adm-j15-peran"));
  // Sari: the class, its students and its figures
  const sc = await ctx();
  const sp = await sc.newPage();
  await magicSignIn(sp, people.guru2.email);
  await sp.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  await tutupTur(sp);
  const rumah = await bodyText(sp);
  await sp.goto(`${APP}/mengajar/${kelas}`, { waitUntil: "networkidle" });
  await tutupTur(sp);
  const roster = norm(await sp.locator("#pin-kelas-murid").first().innerText().catch(() => ""));
  await sp.goto(`${APP}/mengajar/${kelas}/bukti`, { waitUntil: "networkidle" });
  await tutupTur(sp);
  const bukti = norm(await sp.locator("main").innerText().catch(() => ""));
  rec.shots.push(await shot(sp, "adm-j15-sari-bukti"));
  await sc.close();
  const pahamTeks = persen(HARAP.paham);
  // Budi: refused the class he no longer teaches
  const bc = await ctx();
  const bp = await bc.newPage();
  await magicSignIn(bp, people.guru.email);
  await bp.goto(`${APP}/mengajar/${kelas}`, { waitUntil: "networkidle" });
  const ditolak = (await bp.locator(".pin-refusal").count()) > 0 || !(await bodyText(bp)).includes("Kelas 1A");
  rec.shots.push(await shot(bp, "adm-j15-budi"));
  await bc.close();
  const ok = g.ok === "ok" && /Kelas 1A/.test(rumah) && roster.includes(MURID[0]) && bukti.includes(pahamTeks) && ditolak;
  if (!ok) rec.verdict = "FAIL";
  return `${jejak.join(" | ")}; Sari's home lists Kelas 1A ${/Kelas 1A/.test(rumah)}; her roster: "${roster.slice(0, 120)}"; ` +
    `«Lihat bukti» shows the class's comprehension ${pahamTeks} from before her: ${bukti.includes(pahamTeks)}; Budi refused Kelas 1A: ${ditolak}`;
});

// ADM-J09 (J3.6): a student the school admin recorded in the Tingkat only, before the classes were settled,
// is placed in a Kelas of that Tingkat afterwards. Gita is recorded on the Pendataan screen with Tempat «Kelas 1»
// (the Tingkat); on Konfigurasi → «Pindah kelas» the Tingkat is offered under «Masih di Tingkat, belum di Kelas»;
// the admin places her in Kelas 1A. One person; the Tingkat placement closed with MOVED, Kelas 1A open.
await step("S26c", "a student recorded in the Tingkat only is placed in one of its Kelas on Konfigurasi → Pindah kelas (ADM-J09)", async (rec) => {
  const kelas = kelasSatuA();
  if (!kelas) { rec.verdict = "BLOCKED"; return "no Kelas 1A"; }
  const nama = "Gita Murid";
  const tingkat = sql(`select parent_id from public.org_nodes where id='${kelas}'`).trim();
  const tahunIni = sql(`select ap.name from public.org_nodes n join public.academic_periods ap on ap.id = n.academic_period_id where n.id='${kelas}'`).trim();
  const catat = await catatLewatLayar(a, [nama], rec.shots, { kelas: `Kelas 1 · ${tahunIni}` })
    .catch((e) => `not recorded: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`);
  const tempatQ = `select coalesce(string_agg(n.name || ':' || coalesce(m.close_reason::text, 'open'), ',' order by m.valid_from, m.valid_to nulls last), '-') from public.memberships m join public.enrollments e on e.id = m.enrollment_id join public.persons p on p.id = e.person_id join public.org_nodes n on n.id = m.node_id where p.display_name='${nama}' and n.institution_id='${ids.sd}'`;
  const awal = sql(tempatQ).trim();
  if (awal !== "Kelas 1:open") { rec.verdict = "FAIL"; return `${catat}; ${nama} is placed ${awal}, not in Tingkat «Kelas 1» only`; }
  await a.goto(`${APP}/konfigurasi/pindah?muat=${Date.now()}#pindah`, { waitUntil: "networkidle" });
  const grup = a.locator('#pin-pindah-dari optgroup[label="Masih di Tingkat, belum di Kelas"] option');
  const opsiT = await grup.evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() })));
  const t1 = opsiT.find((o) => o.v === tingkat);
  if (!t1) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "adm-j09-tanpa-tingkat"));
    return `${catat}; «Pindah kelas» does not offer Tingkat «Kelas 1» to start from: ${JSON.stringify(opsiT)}`;
  }
  await a.locator("#pin-pindah-dari").selectOption(t1.v);
  await a.locator("#pindah").getByRole("button", { name: "Tampilkan murid", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("dari") === tingkat, { timeout: SLOW });
  await a.waitForLoadState("networkidle");
  const baris = a.locator("#pindah li").filter({ hasText: nama }).first();
  if (!(await baris.count())) { rec.verdict = "FAIL"; return `${catat}; ${nama} is not listed under «${t1.t}»: ${norm(await a.locator("#pindah").innerText().catch(() => "")).slice(0, 200)}`; }
  // the destinations offered: every option but the disabled «Pindahkan ke kelas» prompt (value "")
  const opsiK = (await baris.locator('select[name="kelas"] option').evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() }))))
    .filter((o) => o.v).map((o) => o.t);
  const keA = opsiK.find((o) => o.startsWith("Kelas 1A"));
  rec.shots.push(await shot(a, "adm-j09-dari-tingkat"));
  await baris.locator('select[name="kelas"]').selectOption({ label: keA });
  await baris.getByRole("button", { name: `Pindahkan · ${nama}`, exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "pindah" && u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await a.waitForLoadState("networkidle");
  rec.shots.push(await shot(a, "adm-j09-ditempatkan"));
  const u = new URL(a.url());
  const sesudah = norm(await a.locator("#pindah").innerText().catch(() => ""));
  const masihTingkat = await a.locator('#pin-pindah-dari optgroup[label="Masih di Tingkat, belum di Kelas"] option').count();
  const akhir = sql(tempatQ).trim();
  const orang = sql(`select count(*) from public.persons p join public.institutional_identities ii on ii.person_id = p.id where p.display_name='${nama}' and ii.institution_id='${ids.sd}'`).trim();
  const status = sql(`select coalesce(string_agg(e.status::text, ','), '-') from public.enrollments e join public.persons p on p.id = e.person_id where p.display_name='${nama}' and e.institution_id='${ids.sd}'`).trim();
  // only Kelas of the Tingkat were offered: every option names one of Kelas 1's own Kelas
  const milikTingkat = sql(`select coalesce(string_agg(name, ',' order by name), '') from public.org_nodes where parent_id='${tingkat}' and kind='CLASS' and is_active`).trim().split(",");
  const hanyaKelasnya = opsiK.length > 0 && opsiK.every((o) => milikTingkat.some((k) => o.startsWith(`${k} (`)));
  const ok = u.searchParams.get("hasil") === "ok" && u.searchParams.get("dari") === kelas && sesudah.includes(nama)
    && akhir === "Kelas 1:MOVED,Kelas 1A:open" && orang === "1" && status === "PENDING" && masihTingkat === 0 && hanyaKelasnya;
  if (!ok) rec.verdict = "FAIL";
  return `${catat}; recorded in ${awal}; «Pindah kelas» offers «${t1.t}» under «Masih di Tingkat, belum di Kelas»; destinations offered ${JSON.stringify(opsiK)} ` +
    `(only Kelas 1's own: ${hanyaKelasnya}); after «Pindahkan»: hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")}, showing ` +
    `${u.searchParams.get("dari") === kelas ? "Kelas 1A" : u.searchParams.get("dari")} with ${nama}: ${sesudah.includes(nama)}; placements: ${akhir}; ` +
    `persons named ${nama}: ${orang}; enrolment ${status}; Tingkat still offered to start from: ${masihTingkat > 0}`;
});

// W18 (D-088(d)): continue before beginning, with two chapters. Gita (S26c) joins late: her class card, Bab 1's
// Pemetaan Awal, Bab 1's first lesson read to its last page. Meanwhile the school publishes SD 5 Bab 2 by the same
// screens (Gladys imports it and takes it through the seven steps with the school admin, who then sets its pass mark)
// and Bu Guru Sari, Kelas 1A's teacher since S26b, gives it to the class on Siapkan, where it reads «Materi sekolah»
// (M6). Gita's home must lead with Bab 1, the reading she is in the middle of, and list Bab 2's Pemetaan Awal after
// it; once she opens Bab 2's Pemetaan Awal, that running sitting leads. Before W18 the unstarted Bab 2 mapping led.
await step("S26d", "two chapters: Gita, part-way through Bab 1, finds her home continuing Bab 1 before Bab 2's Pemetaan Awal, and a sitting she has started leads (W18, D-088(d)); Bab 2 is published by the screens and given to the class as «Materi sekolah» (M6)", async (rec) => {
  const kelas = kelasSatuA();
  const bab1 = babSatu();
  const la1 = bab1 && kelas ? sql(`select id from public.learning_assignments where course_id='${bab1}' and node_id='${kelas}' order by created_at desc limit 1`).trim() : "";
  if (!terbitBab || !la1) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "no Bab 1 assignment for Kelas 1A"; }
  const f = new URL("./fixtures/sd5-sintetis-bab2.paket.json", import.meta.url);
  if (!existsSync(f) || !paketContoh) { rec.verdict = "NOTE"; return "candidate predates BOB-02, or the Bab 2 fixture is absent"; }
  const notes = [];

  // 1. Gladys imports Bab 2 into SD and confirms it
  const r = await kirimPaket("SD Zayd", readFileSync(f, "utf8"));
  if (r.batch) {
    await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
    const btn = g.locator(`form:has(input[name="batch"][value="${r.batch}"]) button[type="submit"]`).first();
    if (await btn.count()) { await btn.click(); await g.waitForLoadState("networkidle"); await g.waitForTimeout(1500); }
  }
  const bab2 = sql(`select id from public.courses where institution_id='${ids.sd}' and title like 'Matematika Kelas 5%' and title like '%Bab 2:%' order by created_at desc limit 1`).trim();
  notes.push(`Bab 2 imported: hasil=${r.hasil} detail=${r.detail}, course ${bab2 ? "made" : "missing"}`);
  if (!bab2) { rec.verdict = "FAIL"; return notes.join("; "); }

  // 2. the seven steps, two people, as Bab 1 went (S17)
  if (!(await terbitkanLewatLayar(bab2, rec, notes, { nama: "Bab 2", awalan: "bab2-", tanpaLemah: true }))) return notes.join("; ");
  if (!keadaanBab(bab2).endsWith("|PUBLISHED")) { rec.verdict = "FAIL"; notes.push(`Bab 2 ended ${keadaanBab(bab2)}`); return notes.join("; "); }

  // 3. the school admin sets Bab 2's pass mark on Konfigurasi → Batas ketuntasan
  await a.goto(`${APP}/konfigurasi/ketuntasan?sekolah=${ids.sd}&muat=${Date.now()}#ketuntasan`, { waitUntil: "networkidle" });
  await tutupTur(a);
  const barisBatas = a.locator(`#ketuntasan li[data-pelajaran="${bab2}"]`);
  if (!(await barisBatas.count())) { rec.verdict = "FAIL"; notes.push("Konfigurasi lists no Bab 2 under Batas ketuntasan"); return notes.join("; "); }
  // B1: a record's one action opens its short form in place first
  await barisBatas.locator("[data-buka-ubah]").click();
  await barisBatas.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await barisBatas.locator('input[name="persen"]').fill("60");
  await barisBatas.locator('input[name="alasan"]').fill("Keputusan rapat guru");
  await barisBatas.getByRole("button", { name: "Tetapkan", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW });
  const batas2 = sql(`select coalesce(max(m.percent)::text, '-') from public.school_pass_marks m where m.institution_id='${ids.sd}' and m.course_id='${bab2}'
    and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`).trim();
  notes.push(`Bab 2's pass mark set on Konfigurasi: ${batas2}%`);
  if (batas2 !== "60") rec.verdict = "FAIL";

  // 4. Bu Guru Sari gives Bab 2 to Kelas 1A on Siapkan; the row says where the material comes from (M6)
  const tc = await ctx();
  const t = await tc.newPage();
  await magicSignIn(t, people.guru2.email);
  // CR-35: before Bab 2 is given, her home names it «Layak dikerjakan lebih dulu», published for Kelas 1A, with the way
  // to prepare it for that class (the card is the one thing worth doing; Bab 1 is given already)
  await t.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  await tutupTur(t);
  const layak = t.locator('[data-tur="layak"]');
  const layakTeks = (await layak.count()) ? (await layak.innerText()).replace(/\s+/g, " ").trim() : "";
  const layakKe = (await layak.count()) ? await layak.locator(`a[href*="/mengajar/${kelas}/siapkan?terbitan="]`).count() : 0;
  notes.push(`her home before Bab 2 is given: «${layakTeks.slice(0, 180)}»; a way to prepare it for Kelas 1A: ${layakKe > 0}`);
  if (!/Layak dikerjakan lebih dulu/.test(layakTeks) || !/Bab 2/.test(layakTeks) || layakKe < 1) rec.verdict = "FAIL";
  await t.goto(`${APP}/mengajar/${kelas}/siapkan`, { waitUntil: "networkidle" });
  await tutupTur(t);
  const row = t.locator("a.pin-row").filter({ hasText: "Bab 2" }).first();
  if (!(await row.count())) { rec.verdict = "FAIL"; await tc.close(); notes.push(`Siapkan does not offer Bab 2: ${(await bodyText(t)).slice(0, 200)}`); return notes.join("; "); }
  const asal = norm(await row.locator(".pin-asal").first().innerText().catch(() => ""));
  if (asal !== "Materi sekolah") rec.verdict = "FAIL";
  rec.shots.push(await shot(t, "w18-siapkan-bab2"));
  await row.click();
  await t.waitForLoadState("networkidle");
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + 30 * 86400000));
  await t.locator("#pin-sampai").fill(sampai).catch(() => {});
  await t.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await t.waitForLoadState("networkidle");
  await t.waitForTimeout(1500);
  const kodeSedia = new URL(t.url()).searchParams.get("kode");
  await tc.close();
  const la2 = sql(`select id from public.learning_assignments where course_id='${bab2}' and node_id='${kelas}' order by created_at desc limit 1`).trim();
  notes.push(`Siapkan's Bab 2 row reads «${asal}»; «Sediakan» by Sari → ${la2 ? "given to Kelas 1A" : `not given${kodeSedia ? ` (kode=${kodeSedia})` : ""}`}`);
  if (!la2) { rec.verdict = "FAIL"; return notes.join("; "); }

  // 5. Gita's card, by clicking on her row
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  const barisGita = a.locator("li.pin-akt-orang", { hasText: "Gita Murid" }).first();
  if (!(await barisGita.count())) { rec.verdict = "FAIL"; notes.push("Gita is not listed on Aktivasi"); return notes.join("; "); }
  await barisGita.getByRole("button", { name: "Buat kartu kelas", exact: true }).click();
  await barisGita.locator("strong.pin-num").nth(1).waitFor({ timeout: SLOW });
  const [nomor, pin] = await barisGita.locator("strong.pin-num").allInnerTexts();

  // 6. Gita: Bab 1's Pemetaan Awal, then its first lesson to the last page
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(nomor);
    await s.locator("#pin").fill(pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.waitForLoadState("networkidle");
    await s.goto(`${APP}/belajar/${la1}/pemetaan`, { waitUntil: "networkidle" });
    await tutupTur(s);
    await s.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
    const pre = await jawab(s, "pre", 2);
    await s.goto(`${APP}/belajar/${la1}/peta`, { waitUntil: "networkidle" });
    await tutupTur(s);
    await s.getByRole("link", { name: "Buka pelajarannya" }).first().click();
    await s.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
    await s.locator("h1").first().waitFor({ timeout: SLOW });
    const posisi = async () => norm(await s.locator("p.pin-lpos").first().innerText().catch(() => ""));
    const lanjut = s.getByRole("button", { name: "Halaman berikutnya", exact: true });
    for (let i = 0; i < 30 && (await lanjut.isEnabled().catch(() => false)); i++) {
      const sebelum = await posisi();
      await lanjut.click();
      await s.waitForFunction((prev) => document.querySelector("p.pin-lpos")?.innerText.replace(/\s+/g, " ").trim() !== prev, sebelum, { timeout: SLOW });
    }
    await s.waitForTimeout(1500); // the page reached is saved on view
    notes.push(`Gita: card made on her row; Bab 1's Pemetaan Awal handed in (${pre.answered} answered); the first lesson read to «${await posisi()}»`);

    // 7. her home: Bab 1 leads, Bab 2's Pemetaan Awal after it
    const rumah = async () => {
      await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
      await tutupTur(s);
      const href = (await s.locator("section.pin-lanjut a.pin-primary").first().getAttribute("href").catch(() => null)) ?? "";
      const di = norm(await s.locator("section.pin-lanjut .pin-where").first().innerText().catch(() => ""));
      const kartu = await s.locator("article.pin-tugas").evaluateAll((els) => els.map((e) => ({
        judul: (e.querySelector(".pin-ttitle")?.textContent ?? "").trim(),
        href: e.querySelector("a.pin-btn")?.getAttribute("href") ?? "",
      })));
      return { href, di, kartu };
    };
    const h1 = await rumah();
    rec.shots.push(await shot(s, "w18-rumah-lanjut-bab1"));
    const urut1 = h1.kartu.map((k) => (/Bab 1:/.test(k.judul) ? "Bab 1" : /Bab 2:/.test(k.judul) ? "Bab 2" : k.judul));
    const kartu2 = h1.kartu.find((k) => /Bab 2:/.test(k.judul));
    const lanjutBab1 = h1.href.startsWith(`/belajar/${la1}/`) && !h1.href.endsWith("/pemetaan") && /Bab 1:/.test(h1.di);
    const bab2Sesudah = urut1[0] === "Bab 1" && urut1[1] === "Bab 2" && (kartu2?.href ?? "").endsWith(`/belajar/${la2}/pemetaan`);
    notes.push(`her home leads with "${h1.di}" → ${h1.href.replace(la1, "<bab1>").replace(la2, "<bab2>")}; chapters in order ${JSON.stringify(urut1)}, Bab 2's card → ${(kartu2?.href ?? "-").replace(la2, "<bab2>")}`);
    if (!lanjutBab1 || !bab2Sesudah) rec.verdict = "FAIL";

    // 8. she opens Bab 2's Pemetaan Awal and goes home: the running sitting leads
    await s.goto(`${APP}/belajar/${la2}/pemetaan`, { waitUntil: "networkidle" });
    await tutupTur(s);
    await s.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
    await s.locator("h2.pin-stem").first().waitFor({ timeout: SLOW });
    const h2 = await rumah();
    rec.shots.push(await shot(s, "w18-rumah-sesi-berjalan"));
    const berjalan = sql(`select count(*) from public.assessment_sessions ss join public.assessment_assignments aa on aa.id = ss.assessment_assignment_id
      join public.persons p on p.id = ss.person_id where aa.learning_assignment_id='${la2}' and p.display_name='Gita Murid' and ss.status::text not in ('FINALIZED')`).trim();
    notes.push(`after opening Bab 2's Pemetaan Awal (${berjalan} sitting under way) her home leads with "${h2.di}" → ${h2.href.replace(la1, "<bab1>").replace(la2, "<bab2>")}`);
    if (h2.href !== `/belajar/${la2}/pemetaan` || berjalan === "0") rec.verdict = "FAIL";
  } finally {
    await sc.close();
  }
  return notes.join("; ");
});

// X-05 (the ineligible learner): Eka left Kelas 1A for Kelas 1B in S25, before Bab 2 was given to Kelas 1A (S26d).
// Bab 2 is never on her home, and its address is refused to her; the eligible students have it (S26d).
await step("S26d2", "the ineligible learner: Eka, moved out of Kelas 1A before Bab 2 was given to it, finds no Bab 2 on her home, and its address is refused to her (X-05)", async (rec) => {
  const k = kartuKelas.find((x) => x.nama === MURID[4]);
  const bab2 = sql(`select id from public.courses where institution_id='${ids.sd}' and title like 'Matematika Kelas 5%' and title like '%Bab 2:%' order by created_at desc limit 1`).trim();
  const la2 = bab2 ? sql(`select id from public.learning_assignments where course_id='${bab2}' and node_id='${kelasSatuA()}' order by created_at desc limit 1`).trim() : "";
  if (!k || !la2) { rec.verdict = "BLOCKED"; return !k ? "no card for Eka (S20)" : "Bab 2 was not given to Kelas 1A (S26d)"; }
  const sc = await ctx();
  const s = await sc.newPage();
  try {
    await s.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await s.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await s.locator("#kartu").fill(k.number);
    await s.locator("#pin").fill(k.pin);
    await s.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await s.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await s.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    await tutupTur(s);
    const judul = await s.locator("article.pin-tugas .pin-ttitle").allInnerTexts().catch(() => []);
    const adaBab2 = judul.some((j) => /Bab 2:/.test(j)) || (await s.locator(`a[href*="${la2}"]`).count()) > 0;
    rec.shots.push(await shot(s, "x05-eka-tanpa-bab2"));
    await s.goto(`${APP}/belajar/${la2}`, { waitUntil: "networkidle" });
    const ditolak = (await s.locator(".pin-refusal").count()) > 0 || !new URL(s.url()).pathname.startsWith(`/belajar/${la2}`)
      || /tidak ada|tidak ditemukan/i.test(norm(await s.locator("h1").first().innerText().catch(() => "")));
    rec.shots.push(await shot(s, "x05-eka-bab2-ditolak"));
    const akhir = new URL(s.url()).pathname.replace(la2, "<bab2>");
    if (adaBab2 || !ditolak) rec.verdict = "FAIL";
    await sc.close();
    return `Eka's home lists ${JSON.stringify(judul.map((j) => j.replace(/^Matematika Kelas 5 · /, "")))}; Bab 2 there: ${adaBab2}; ` +
      `Bab 2's address refused to her: ${ditolak} (ended at ${akhir})`;
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(s, "x05-berhenti"));
    await sc.close();
    return `stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`;
  }
});

// D-085 T2: Uji Cepat as ruled. Bu Guru Sari opens Uji Cepat for Kelas 1A, chooses Bab 1, sees its questions (stem,
// options, topic; no key), ticks three practice questions, reviews exactly those and launches. Budi Murid (still in
// Kelas 1A) finds it on /belajar and hands it in: his paper is exactly the three ticked. The running Uji Cepat then
// leads Sari to «Lihat per soal» (M5), which shows those three questions with his answers. On a release before T2 the
// page has no questions to tick: NOTE, not FAIL.
await step("S26e", "Uji Cepat as T2 rules it: the teacher chooses Bab 1, sees its questions, ticks three, reviews exactly those and launches; a student's paper is exactly the three; «Lihat per soal» then shows them (D-085 T2, M5)", async (rec) => {
  const kelas = kelasSatuA();
  const bab1 = babSatu();
  const modul = bab1 ? sql(`select id from public.modules where course_id='${bab1}' order by ordinal limit 1`).trim() : "";
  const siswa = kartuKelas.find((k) => k.nama === MURID[1]);
  if (!terbitBab || !kelas || !modul || !siswa) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "no Kelas 1A, Bab 1 chapter or card for Budi Murid"; }
  const notes = [];
  const tc = await ctx();
  const t = await tc.newPage();
  try {
    await magicSignIn(t, people.guru2.email);
    await t.goto(`${APP}/mengajar/${kelas}/uji-cepat`, { waitUntil: "networkidle" });
    await tutupTur(t);
    if (/Uji Cepat sedang berjalan/.test(await bodyText(t))) { rec.verdict = "NOTE"; return "an Uji Cepat is already running in Kelas 1A"; }
    if (!(await t.locator("#pin-bab").count())) { rec.verdict = "FAIL"; return `no chapter to choose on Uji Cepat: ${(await bodyText(t)).slice(0, 240)}`; }
    await t.locator("#pin-bab").selectOption(modul);
    const tampil = t.getByRole("button", { name: "Tampilkan soal bab ini", exact: true });
    if (!(await tampil.count())) { rec.verdict = "NOTE"; return "this release has no questions to tick on Uji Cepat (before D-085 T2)"; }
    await tampil.click();
    await t.waitForURL((u) => u.searchParams.get("bab") === modul, { timeout: SLOW });
    await t.waitForLoadState("networkidle");
    // the questions offered, against what an Uji Cepat on the chapter may carry (practice and test questions of the
    // learner-supported types, the school's own)
    const baris = t.locator("ol.pin-cepat-pilih > li");
    const ditawarkan = await baris.count();
    const harap = Number(sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id
      join public.item_type_learner_support s on s.item_type = i.item_type
     where l.module_id='${modul}' and i.institution_id='${ids.sd}' and i.bank_type in ('PRACTICE', 'TEST')`).trim());
    const kunciTampak = await t.locator("ol.pin-cepat-pilih .pin-opsi-kunci").count();
    rec.shots.push(await shot(t, "t2-pilih-soal"));
    // three questions not marked for the chapter's own tests
    const dicentang = [];
    for (let i = 0; i < ditawarkan && dicentang.length < 3; i++) {
      const li = baris.nth(i);
      if (/Juga di (Pemetaan Awal|Uji Penguasaan)/.test(norm(await li.innerText()))) continue;
      const kotak = li.locator('input[type="checkbox"][name="butir"]');
      await kotak.check();
      dicentang.push(await kotak.getAttribute("value"));
    }
    notes.push(`Bab 1 offers ${ditawarkan} question(s) to tick (an Uji Cepat on it may carry ${harap}), keys shown ${kunciTampak}; ticked ${dicentang.length}`);
    if (ditawarkan !== harap || kunciTampak !== 0 || dicentang.length !== 3) { rec.verdict = "FAIL"; return notes.join("; "); }
    await t.getByRole("button", { name: "Lanjut ke tinjauan", exact: true }).click();
    await t.waitForURL((u) => u.searchParams.get("tahap") === "tinjau", { timeout: SLOW });
    await t.locator(".pin-cepat-dipilih").first().waitFor({ timeout: SLOW });
    const ditinjau = await t.locator(".pin-cepat-dipilih li[data-butir]").evaluateAll((els) => els.map((e) => e.getAttribute("data-butir")));
    rec.shots.push(await shot(t, "t2-tinjau"));
    const samaTinjau = JSON.stringify([...ditinjau].sort()) === JSON.stringify([...dicentang].sort());
    await t.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).click();
    await t.getByText("Uji Cepat sedang berjalan").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(t, "t2-berjalan"));
    const aa = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      where aa.node_id='${kelas}' and d.mode::text = 'QUICK' order by aa.created_at desc limit 1`).trim();
    const tersimpan = sql(`select coalesce(string_agg(q.item_id::text, ',' order by q.item_id::text), '') from public.quick_assessment_selections q
      join public.assessment_assignments aa on aa.assessment_definition_id = q.definition_id where aa.id='${aa}'`).trim();
    const samaSimpan = tersimpan === [...dicentang].sort().join(",");
    notes.push(`the review lists the ticked three: ${samaTinjau}; launched, the stored choice is the ticked three: ${samaSimpan}`);
    if (!aa || !samaTinjau || !samaSimpan) { rec.verdict = "FAIL"; return notes.join("; "); }

    // Budi Murid sits it
    const sc = await ctx();
    const sp = await sc.newPage();
    try {
      await sp.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
      await sp.getByRole("button", { name: "Gunakan kartu kelas" }).click();
      await sp.locator("#kartu").fill(siswa.number);
      await sp.locator("#pin").fill(siswa.pin);
      await sp.getByRole("button", { name: "Masuk dengan kartu" }).click();
      await sp.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
      await sp.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
      await tutupTur(sp);
      const tautan = sp.locator(`a[href="/belajar/asesmen/${aa}"]`);
      if (!(await tautan.count())) { rec.verdict = "FAIL"; notes.push(`Budi's /belajar does not offer the Uji Cepat: ${(await bodyText(sp)).slice(0, 200)}`); return notes.join("; "); }
      await tautan.first().click();
      await sp.waitForURL((u) => u.pathname === `/belajar/asesmen/${aa}`, { timeout: SLOW });
      await sp.locator("main button[type=submit].pin-primary").first().click();
      const r = await jawab(sp, "post", 2);
      const kertas = sql(`select coalesce(string_agg(pi.item_id::text, ',' order by pi.item_id::text), '') from public.presented_items pi
        join public.assessment_sessions ss on ss.id = pi.session_id
        join public.persons p on p.id = ss.person_id where ss.assessment_assignment_id='${aa}' and p.display_name='${MURID[1]}'`).trim();
      const samaKertas = kertas === [...dicentang].sort().join(",");
      notes.push(`Budi found it on /belajar and handed it in (${r.answered} answered); his paper is the ticked three: ${samaKertas}`);
      if (!samaKertas || r.answered !== 3) rec.verdict = "FAIL";
    } finally {
      await sc.close();
    }

    // the teacher: from the running Uji Cepat to the class's answers, question by question (M5)
    await t.goto(`${APP}/mengajar/${kelas}/uji-cepat`, { waitUntil: "networkidle" });
    const perSoal = t.locator(`a[href="/mengajar/${kelas}/soal?penugasan=${aa}"]`);
    if (!(await perSoal.count())) { rec.verdict = "FAIL"; notes.push("the running Uji Cepat does not lead to «Lihat per soal»"); return notes.join("; "); }
    await perSoal.first().click();
    await t.waitForURL((u) => u.pathname === `/mengajar/${kelas}/soal`, { timeout: SLOW });
    await t.locator("h1").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(t, "t2-per-soal"));
    const nSoal = await t.locator("li.pin-soal-baris").count();
    const terkumpul = Number(norm(await bodyText(t)).match(/Jawaban yang sudah dikumpulkan · (\d+)/)?.[1] ?? -1);
    notes.push(`«Lihat per soal»: ${nSoal} question(s), handed in ${terkumpul}`);
    if (nSoal !== 3 || terkumpul !== 1) rec.verdict = "FAIL";
  } finally {
    await tc.close();
  }
  return notes.join("; ");
});

// D-085 M10: a correction is a new release of the same chapter. Gladys publishes S14's «Pecahan untuk Kelas 4» by the
// screens, then corrects it as a school would: from the course's page «Unggah buku kerja perbaikan» opens the upload
// on that course; without saying what changed the check asks for it; with a summary the corrected workbook (one
// lesson's summary reworded) is saved as the next version of the same course. Its page lists the line's history,
// the old page leads to it, it is published as 1.1.0 superseding 1.0.0, and «Siapkan materi» offers Kelas 1A the
// correction only.
await step("S26f", "a correction by the screens: from a published course's page to the upload of its corrected workbook, with what changed and why; the correction is the next version of the same course, published as 1.1.0, and the class is offered only it (D-085 M10)", async (rec) => {
  const asal = sql(`select id from public.courses where institution_id='${ids.sd}' and title='Pecahan untuk Kelas 4' and supersedes_course_id is null order by created_at limit 1`).trim();
  const buku = join(process.env.APP_DIR, "audit/fixtures/contoh-pelajaran-perbaikan.xlsx");
  const paketBuku = join(process.env.APP_DIR, "selftest/fixtures/bob02/contoh-pelajaran.paket.json");
  if (!asal || !existsSync(buku) || !existsSync(paketBuku)) { rec.verdict = "BLOCKED"; return !asal ? "S14 left no «Pecahan untuk Kelas 4» course" : "no corrected workbook in this candidate"; }
  const notes = [`start ${keadaanBab(asal)}`];
  if (!keadaanBab(asal).endsWith("|PUBLISHED")) {
    if (!(await terbitkanLewatLayar(asal, rec, notes, { nama: "Pecahan", awalan: "m10-asal-" }))) return notes.join("; ");
  }
  const rilisAsal = sql(`select id || '|' || version_label from public.plp_releases where course_id='${asal}' and status='PUBLISHED' order by created_at desc limit 1`).trim();
  notes.push(`published: ${rilisAsal.split("|")[1] ?? "-"}`);

  // 1. from the course's own page to the upload, on that course
  await g.goto(`${APP}/studio/paket/${asal}`, { waitUntil: "networkidle" });
  const ke = g.locator(`#revisi a[href^="/studio/unggah?revisi=${asal}"]`);
  if (!(await ke.count())) {
    const salinan = await g.getByRole("button", { name: "Buat salinan untuk diperbaiki", exact: true }).count();
    rec.verdict = salinan ? "NOTE" : "FAIL";
    notes.push(salinan ? "this candidate corrects by a copy (before D-085 M10's correction upload)" : `no way to correct the published course: ${(await bodyText(g)).slice(0, 200)}`);
    return notes.join("; ");
  }
  rec.shots.push(await shot(g, "m10-perbaiki"));
  await ke.first().click();
  await g.waitForURL((u) => u.pathname === "/studio/unggah", { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  const dipilih = await g.locator("#ung-revisi").inputValue().catch(() => "");
  const sekolah = norm(await g.locator("#ung-sekolah option:checked").textContent().catch(() => ""));
  notes.push(`the upload opens on the course: ${dipilih === asal} (school ${sekolah})`);
  if (dipilih !== asal) { rec.verdict = "FAIL"; return notes.join("; "); }

  // 2. the corrected workbook without saying what changed: the check asks for it
  await g.locator("#ung-berkas").setInputFiles(buku);
  await g.getByRole("button", { name: "Periksa buku kerja" }).click();
  const minta = await g.getByText("Tulis apa yang diperbaiki dan mengapa").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  rec.shots.push(await shot(g, "m10-tanpa-ringkasan"));
  notes.push(`without a summary the check asks what changed and why: ${minta}`);
  if (!minta) rec.verdict = "FAIL";

  // 3. with the summary: checked, its media, saved
  const RINGKASAN = "Ringkasan pelajaran 1 diperjelas: pecahan adalah bagian dari keseluruhan yang dibagi sama besar.";
  await g.locator("#ung-ringkasan").fill(RINGKASAN);
  await g.getByRole("button", { name: "Periksa buku kerja" }).click();
  const lolos = await g.getByText("Buku kerja lolos pemeriksaan.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  if (!lolos) { rec.verdict = "FAIL"; notes.push(`the check did not pass: ${(await bodyText(g)).slice(0, 240)}`); return notes.join("; "); }
  const dir = join(OUT, "media-s26f");
  mkdirSync(dir, { recursive: true });
  const names = JSON.parse(readFileSync(paketBuku, "utf8")).courses
    .flatMap((c) => c.modules.flatMap((m) => m.lessons.flatMap((l) => (l.media ?? []).map((x) => x.file))));
  const files = names.map((n) => { const f = join(dir, n); writeFileSync(f, `audit stand-in for ${n}`); return f; });
  if (files.length) {
    await g.locator("#ung-media").setInputFiles(files);
    await g.getByRole("button", { name: "Unggah media" }).click();
    await g.getByText(new RegExp(`^${files.length}\\s/\\s${files.length}`)).waitFor({ timeout: 60000 }).catch(() => {});
  }
  await g.getByRole("button", { name: "Simpan ke Studio" }).click();
  const saved = await g.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  rec.shots.push(await shot(g, "m10-tersimpan"));
  const baru = sql(`select id from public.courses where supersedes_course_id='${asal}' order by created_at desc limit 1`).trim();
  if (!saved || !baru) { rec.verdict = "FAIL"; notes.push(`saved: ${saved}; correction in the line: ${!!baru}`); return notes.join("; "); }
  const ringkasanDb = sql(`select n.summary || '|' || coalesce(p.display_name, '-') from public.course_revision_notes n
    left join public.persons p on p.id = n.written_by_person_id where n.course_id='${baru}'`).trim();
  const diaudit = Number(sql(`select count(*) from public.audit_log where action='COURSE_CORRECTION_UPLOADED' and target_id='${baru}'`).trim());
  const isi = sql(`select l.summary from public.lessons l join public.modules m on m.id = l.module_id where m.course_id='${baru}' order by m.ordinal, l.ordinal limit 1`).trim();
  notes.push(`saved in the line; note "${ringkasanDb}"; audited ${diaudit}; lesson 1 now reads "${isi}"`);
  if (!ringkasanDb.startsWith(`${RINGKASAN}|`) || ringkasanDb.endsWith("|-") || diaudit !== 1 || !/dibagi sama besar/.test(isi)) rec.verdict = "FAIL";

  // 4. the new course's page: the history, from «Buka kursus»; the old page leads forward
  await g.getByRole("link", { name: /^Buka (kursus|paket)$/ }).click();
  await g.waitForURL((u) => u.pathname === `/studio/paket/${baru}`, { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  const versi = await g.locator("#riwayat li.pin-riwayat").count();
  const riwayat = norm(await g.locator("#riwayat").innerText().catch(() => ""));
  rec.shots.push(await shot(g, "m10-riwayat"));
  await g.goto(`${APP}/studio/paket/${asal}`, { waitUntil: "networkidle" });
  const maju = await g.locator(`[data-penerus="${baru}"]`).count();
  const tawarLagi = await g.locator("#revisi a").count();
  notes.push(`history lists ${versi} version(s), with the summary: ${riwayat.includes(RINGKASAN)}; the old page leads to the correction: ${maju > 0}, and no longer offers to correct it: ${tawarLagi === 0}`);
  if (versi !== 2 || !riwayat.includes(RINGKASAN) || !maju || tawarLagi) rec.verdict = "FAIL";

  // 5. reviewed and published like any course: the next version of the same chapter
  if (!(await terbitkanLewatLayar(baru, rec, notes, { nama: "Pecahan (perbaikan)", awalan: "m10-baru-" }))) return notes.join("; ");
  const rilisBaru = sql(`select r.id || '|' || r.version_label || '|' || coalesce((select x.version_label from public.plp_releases x where x.id = r.supersedes_release_id), '-')
    from public.plp_releases r where r.course_id='${baru}' order by r.created_at desc limit 1`).trim();
  const [idBaru, labelBaru, labelLama] = rilisBaru.split("|");
  notes.push(`released ${labelBaru} superseding ${labelLama}`);
  if (labelBaru !== "1.1.0" || labelLama !== (rilisAsal.split("|")[1] ?? "?")) rec.verdict = "FAIL";

  // 6. the class is offered the correction, once
  const kelas = kelasSatuA();
  const tc = await ctx();
  const t = await tc.newPage();
  try {
    await magicSignIn(t, people.guru2.email);
    await t.goto(`${APP}/mengajar/${kelas}/siapkan`, { waitUntil: "networkidle" });
    await tutupTur(t);
    const baris = t.locator("a.pin-row").filter({ hasText: "Pecahan untuk Kelas 4" });
    const n = await baris.count();
    const href = n ? await baris.first().getAttribute("href") : "";
    rec.shots.push(await shot(t, "m10-siapkan"));
    notes.push(`«Siapkan materi» offers «Pecahan untuk Kelas 4» ${n} time(s), the correction: ${!!href && href.endsWith(`terbitan=${idBaru}`)}`);
    if (n !== 1 || !href?.endsWith(`terbitan=${idBaru}`)) rec.verdict = "FAIL";
  } finally {
    await tc.close();
  }
  return notes.join("; ");
});

// ADM-J19: a new school year, by the screens, never run before. The school admin records Fajar in Kelas 1A
// (no card yet, so his enrolment waits: PENDING), makes next year's Tingkat «Kelas 2» and its Kelas 2A on
// Struktur sekolah, then on «Pergantian tahun ajaran» carries Kelas 1A into Kelas 2A. Everyone in 1A,
// Fajar too, is in 2A afterwards; what they did stays recorded in 1A; the screen says how many moved.
await step("S27", "a new school year: the school admin makes next year's Tingkat and Kelas, then carries Kelas 1A into it on «Pergantian tahun ajaran»; the whole class moves, one not yet signed in too, and the screen says how many (ADM-J19)", async (rec) => {
  const kelas = kelasSatuA();
  if (!kelas) { rec.verdict = "BLOCKED"; return "no Kelas 1A"; }
  const tahunIni = sql(`select ap.name from public.org_nodes n join public.academic_periods ap on ap.id = n.academic_period_id where n.id='${kelas}'`).trim();
  const y = Number(tahunIni.slice(0, 4));
  const tahunDepan = `${y + 1}/${y + 2}`;
  // Fajar: recorded on the Pendataan screen, no card
  const catat = await catatLewatLayar(a, ["Fajar Murid"], rec.shots).catch((e) => `not recorded: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`);
  // next year's Tingkat and Kelas on Struktur sekolah
  await a.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  const ft = a.locator("div.pin-str-tambah-tingkat form").first();
  await ft.locator('input[name="nama"]').fill("Kelas 2");
  await ft.locator('input[name="tahun_ajaran"]').fill(tahunDepan);
  await ft.locator('button[type="submit"]').click();
  let t2 = "";
  for (let i = 0; i < 30 && !t2; i++) {
    t2 = sql(`select n.id from public.org_nodes n join public.academic_periods ap on ap.id = n.academic_period_id where n.institution_id='${ids.sd}' and n.kind='COHORT' and n.name='Kelas 2' and ap.name='${tahunDepan}' and n.is_active limit 1`).trim();
    if (!t2) await a.waitForTimeout(500);
  }
  if (!t2) { rec.verdict = "FAIL"; rec.shots.push(await shot(a, "adm-j19-tingkat")); return `${catat}; next year's Tingkat «Kelas 2» (${tahunDepan}) was not made: ${norm(await a.locator("#struktur").innerText().catch(() => "")).slice(0, 200)}`; }
  await a.goto(`${APP}/konfigurasi/struktur#struktur`, { waitUntil: "networkidle" });
  const fk = a.locator("div.pin-str-tambah-kelas form").filter({ has: a.locator(`input[name="tingkat"][value="${t2}"]`) }).first();
  await fk.locator('input[name="nama"]').fill("Kelas 2A");
  await fk.locator('button[type="submit"]').click();
  let k2 = "";
  for (let i = 0; i < 30 && !k2; i++) {
    k2 = sql(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='CLASS' and name='Kelas 2A' and parent_id='${t2}' and is_active limit 1`).trim();
    if (!k2) await a.waitForTimeout(500);
  }
  if (!k2) { rec.verdict = "FAIL"; return `${catat}; Kelas 2A was not made under Tingkat «Kelas 2»`; }
  const sebelum = sql(`select count(*) from public.memberships where node_id='${kelas}' and valid_to is null`).trim();
  // the rollover, on its screen
  await a.goto(`${APP}/konfigurasi/rollover#rollover`, { waitUntil: "networkidle" });
  const fr = a.locator("#rollover form").first();
  if (!(await fr.count())) { rec.verdict = "FAIL"; rec.shots.push(await shot(a, "adm-j19-tanpa-form")); return `${catat}; no rollover form on Konfigurasi with two years: ${norm(await a.locator("#rollover").innerText().catch(() => "")).slice(0, 200)}`; }
  await fr.locator('select[name="from_period"]').selectOption({ label: tahunIni });
  await fr.locator('select[name="to_period"]').selectOption({ label: tahunDepan });
  const peta = fr.locator(`select[name="map[${kelas}]"]`);
  const opsi = (await peta.locator("option").allTextContents()).find((o) => o.startsWith("Kelas 2A"));
  await peta.selectOption({ label: opsi });
  rec.shots.push(await shot(a, "adm-j19-pergantian"));
  // what the form holds at the moment it is sent, so a refusal can be read against it
  const terkirim = await fr.evaluate((f) => [...new FormData(f).entries()]
    .map(([k, v]) => `${k.replace(/\[[0-9a-f-]{36}\]/, "[…]")}=${String(v).slice(0, 8)}`).join(" "));
  await fr.getByRole("button", { name: "Jalankan pergantian", exact: true }).click();
  await a.waitForURL((u) => u.searchParams.get("bagian") === "rollover" && u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await a.waitForLoadState("networkidle");
  rec.shots.push(await shot(a, "adm-j19-hasil"));
  const u = new URL(a.url());
  const kalimat = norm(await a.locator("#rollover").innerText().catch(() => ""));
  const tinggal = sql(`select count(*) from public.memberships where node_id='${kelas}' and valid_to is null`).trim();
  const di2A = sql(`select coalesce(string_agg(p.display_name || ':' || e.status, ',' order by p.display_name), '-') from public.memberships m join public.enrollments e on e.id = m.enrollment_id join public.persons p on p.id = e.person_id where m.node_id='${k2}' and m.valid_to is null`).trim();
  const sesi = sql(`select count(*) from public.assessment_sessions where class_node_id='${kelas}'`).trim();
  const fajar = /Fajar Murid:PENDING/.test(di2A);
  const ok = u.searchParams.get("hasil") === "ok" && u.searchParams.get("kode") === "ROLLOVER_DONE" && u.searchParams.get("n") === sebelum
    && tinggal === "0" && di2A.split(",").length === Number(sebelum) && fajar && Number(sesi) > 0;
  if (!ok) rec.verdict = "FAIL";
  return `${catat}; next year ${tahunDepan}: Tingkat «Kelas 2» and Kelas 2A made on the screen; Kelas 1A had ${sebelum}; form sent: ${terkirim}; after «Jalankan pergantian»: hasil=${u.searchParams.get("hasil")} ` +
    `kode=${u.searchParams.get("kode")} n=${u.searchParams.get("n")}; the screen says "${kalimat.slice(-140)}"; left in 1A: ${tinggal}; in 2A: ${di2A}; ` +
    `Fajar (not yet signed in) carried over: ${fajar}; sessions still recorded in 1A: ${sesi}`;
});
// HOD-08: a head of department assigns and runs an Uji Cepat within their scope. S24 took Bu Kepala Dept's role away;
// the platform administrator appoints her head of Kelas Rendah again, as in S16. She finds on /mengajar exactly the
// Kelas of her department, gives Bab 1 to Eka's Kelas (Kelas 1A's Uji Cepat is S26e's), launches an Uji Cepat of three
// of its questions there, and Eka finds it on her home. A class outside the department is not hers to open.
await step("S27h", "a head of department assigns and runs an Uji Cepat within their department: Mengajar offers exactly its Kelas; the head gives Bab 1 to Eka's Kelas and launches three of its questions there, and she finds it; a class outside it is refused (HOD-08)", async (rec) => {
  // the Kelas Eka was moved to in S25 (S26 renamed it «Kelas 1 Biru»), where she is placed now
  const satuB = sql(`select m.node_id from public.memberships m join public.enrollments e on e.id = m.enrollment_id
    join public.persons p on p.id = e.person_id join public.org_nodes o on o.id = m.node_id
   where p.display_name = '${MURID[4]}' and e.institution_id = '${ids.sd}' and o.kind = 'CLASS' and o.is_active
     and (m.valid_to is null or m.valid_to > now()) order by m.valid_from desc limit 1`).trim();
  const bab1 = babSatu();
  const modul = bab1 ? sql(`select id from public.modules where course_id='${bab1}' order by ordinal limit 1`).trim() : "";
  const siswa = kartuKelas.find((x) => x.nama === MURID[4]);
  if (!terbitBab || !satuB || !modul || !siswa) { rec.verdict = "BLOCKED"; return !terbitBab ? "Bab 1 was not published (S17)" : "no Kelas for Eka (S25), Bab 1 chapter or card for her"; }
  const notes = [];
  // S24 revoked her only role; the platform administrator appoints her again, as in S16
  // RESTATED FOR BOB19-K01 (the owner's ruling of 8 Oct, Option B): S16 recorded her at SD, so after the revocation she
  // is in SD's own list (recorded there, holding nothing there yet); Admin platform in Mengelola · SD appoints her from it
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  const beri = await grantViaForm(g, people.kaprodi.name, "HEAD_OF_DEPARTMENT", "Kelas Rendah");
  notes.push(`the platform administrator gives ${people.kaprodi.name} Kepala departemen at Kelas Rendah again: ${beri.ok}`);
  if (beri.ok !== "ok") { rec.verdict = "FAIL"; return notes.join("; "); }
  // the Kelas a head of Kelas Rendah stands over, current and active
  const lingkup = sql(`select coalesce(string_agg(c.id::text, ',' order by c.id::text), '') from public.org_nodes c
    join public.org_nodes b on b.institution_id = c.institution_id and b.kind = 'DEPARTMENT' and b.name = 'Kelas Rendah'
   where c.institution_id = '${ids.sd}' and c.kind = 'CLASS' and c.is_active and b.id = any (c.jalur)`).trim();
  const hc = await ctx();
  const h = await hc.newPage();
  try {
    await magicSignIn(h, people.kaprodi.email);
    await h.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await tutupTur(h);
    const ditawarkan = await h.locator('a[href^="/mengajar/"]').evaluateAll((els) =>
      [...new Set(els.map((e) => /^\/mengajar\/([0-9a-f-]{36})(?:$|\/)/.exec(e.getAttribute("href") ?? "")?.[1]).filter(Boolean))].sort());
    rec.shots.push(await shot(h, "hod08-mengajar"));
    const sama = ditawarkan.join(",") === lingkup;
    notes.push(`Mengajar offers ${ditawarkan.length} Kelas, exactly the department's ${sama}`);
    if (!sama || !ditawarkan.includes(satuB)) { rec.verdict = "FAIL"; return notes.join("; "); }
    // an Uji Cepat draws on what the class was given (D-085 T2). Eka's Kelas was given nothing after her move (S25,
    // S26d2), and Kelas 1A's own Uji Cepat from S26e is still running, so the head first gives Bab 1 to Eka's Kelas
    await h.goto(`${APP}/mengajar/${satuB}/siapkan`, { waitUntil: "networkidle" });
    await tutupTur(h);
    const barisBab1 = h.locator("a.pin-row").filter({ hasText: "Matematika Kelas 5" }).filter({ hasText: "Bab 1:" }).first();
    if (!(await barisBab1.count())) { rec.verdict = "FAIL"; notes.push(`Siapkan does not offer Bab 1: ${(await bodyText(h)).slice(0, 200)}`); return notes.join("; "); }
    await barisBab1.click();
    const sediakan = h.locator('form:has(input[name="terbitan"]) button[type="submit"]').first();
    await sediakan.waitFor({ timeout: SLOW });
    const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(Date.now() + 30 * 86400000));
    await h.locator("#pin-sampai").fill(sampai).catch(() => {});
    await sediakan.click();
    await h.waitForLoadState("networkidle");
    let diberi = "";
    for (let i = 0; i < 20 && !diberi; i++) {
      diberi = sql(`select coalesce(p.display_name, '-') from public.learning_assignments la left join public.persons p on p.id = la.assigned_by_person_id
        where la.course_id='${bab1}' and la.node_id='${satuB}' order by la.created_at desc limit 1`).trim();
      if (!diberi) await h.waitForTimeout(500);
    }
    notes.push(`Bab 1 given to Eka's Kelas on Siapkan by ${diberi || "nobody"}`);
    if (diberi !== people.kaprodi.name) { rec.verdict = "FAIL"; return notes.join("; "); }
    await h.goto(`${APP}/mengajar/${satuB}/uji-cepat`, { waitUntil: "networkidle" });
    await tutupTur(h);
    if (!(await h.locator("#pin-bab").count())) { rec.verdict = "FAIL"; notes.push(`no chapter to choose: ${(await bodyText(h)).slice(0, 200)}`); return notes.join("; "); }
    await h.locator("#pin-bab").selectOption(modul);
    await h.getByRole("button", { name: "Tampilkan soal bab ini", exact: true }).click();
    await h.waitForURL((u) => u.searchParams.get("bab") === modul, { timeout: SLOW });
    await h.waitForLoadState("networkidle");
    const baris = h.locator("ol.pin-cepat-pilih > li");
    const dicentang = [];
    for (let i = 0; i < (await baris.count()) && dicentang.length < 3; i++) {
      const li = baris.nth(i);
      if (/Juga di (Pemetaan Awal|Uji Penguasaan)/.test(norm(await li.innerText()))) continue;
      const kotak = li.locator('input[type="checkbox"][name="butir"]');
      await kotak.check();
      dicentang.push(await kotak.getAttribute("value"));
    }
    if (dicentang.length !== 3) { rec.verdict = "FAIL"; notes.push(`ticked ${dicentang.length}`); return notes.join("; "); }
    await h.getByRole("button", { name: "Lanjut ke tinjauan", exact: true }).click();
    await h.waitForURL((u) => u.searchParams.get("tahap") === "tinjau", { timeout: SLOW });
    await h.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).click();
    await h.getByText("Uji Cepat sedang berjalan").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(h, "hod08-berjalan"));
    const aa = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      where aa.node_id='${satuB}' and d.mode::text = 'QUICK' order by aa.created_at desc limit 1`).trim();
    const oleh = aa ? sql(`select p.display_name from public.assessment_assignments aa join public.persons p on p.id = aa.assigned_by_person_id where aa.id='${aa}'`).trim() : "";
    notes.push(`launched for Eka's Kelas by ${oleh || "nobody"}`);
    if (!aa || oleh !== people.kaprodi.name) { rec.verdict = "FAIL"; return notes.join("; "); }
    // outside the department: Kelas 1A's next-year Kelas from S27 is in it too, so the refusal is asked of a class of
    // another school, which this head stands over in no way
    const lain = sql(`select id from public.org_nodes where kind='CLASS' and institution_id <> '${ids.sd}' limit 1`).trim();
    if (lain) {
      await h.goto(`${APP}/mengajar/${lain}/uji-cepat`, { waitUntil: "networkidle" });
      const tolak = !(await h.locator("#pin-bab").count());
      notes.push(`another school's class is refused ${tolak}`);
      if (!tolak) rec.verdict = "FAIL";
    } else {
      notes.push("no class outside the school exists to ask (the refusal outside a scope is S24's and S26b's)");
    }
    // Eka, placed in that Kelas, finds it
    const sc = await ctx();
    const sp = await sc.newPage();
    try {
      await masukKartu(sp, siswa);
      await sp.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
      await tutupTur(sp);
      const ada = await sp.locator(`a[href="/belajar/asesmen/${aa}"]`).count();
      rec.shots.push(await shot(sp, "hod08-murid"));
      notes.push(`${siswa.nama} finds it on /belajar ${ada > 0}`);
      if (!ada) rec.verdict = "FAIL";
    } finally {
      await sc.close();
    }
  } catch (e) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(h, "hod08-berhenti"));
    notes.push(`stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
  } finally {
    await hc.close();
  }
  return notes.join("; ");
});


// CROSS-BATCH (6 Nov): a certificate the school revokes, as everyone then meets it. Last of the S steps on purpose: the
// reports and figures above count S21i's certificate as issued. The school admin revokes Ani's certificate on
// «Sertifikat sekolah» with a reason; Ani, signing in by her card, sees «Dicabut» in her list and the revoked banner on
// the certificate itself; and a stranger opening its link sees «Dicabut oleh penerbit».
await step("S27v", "the school revokes a learner's certificate: the learner's list and certificate page say so, and so does its public link (W2.5, STU-17)", async (rec) => {
  const lulus = kartuKelas.find((k) => k.nama === MURID[0]);
  // the chapter is the certificate's own sitting's (S27h gave Bab 1 to another class since, so tugasBab() is not hers)
  const c = lulus ? sql(`select c.id || '|' || c.certificate_number || '|' || c.verification_token || '|' || s.learning_assignment_id
     from public.certificates c join public.persons p on p.id = c.person_id join public.assessment_sessions s on s.id = c.session_id
     where p.display_name = '${lulus.nama}' and c.institution_id = '${ids.sd}' and c.status = 'ISSUED' order by c.issued_at desc limit 1`).trim() : "";
  if (!c) { rec.verdict = "BLOCKED"; return "no issued certificate from S21i"; }
  const [id, nomor, token, tugas] = c.split("|");
  const notes = [];
  await a.goto(`${APP}/konfigurasi/sertifikat?cari=${encodeURIComponent(nomor)}`, { waitUntil: "networkidle" });
  await a.locator(`a[data-cabut-sertifikat="${id}"]`).click();
  await a.locator("#cabut").waitFor({ timeout: SLOW });
  await a.locator("#cabut-alasan").fill("Diterbitkan untuk murid yang salah (uji perjalanan)");
  await a.getByRole("button", { name: "Lanjutkan" }).click();
  await a.getByRole("button", { name: `Cabut sertifikat ${nomor}` }).click();
  await a.getByText(`Sertifikat ${nomor} sudah dicabut`).first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(a, "s27v-dicabut-admin"));
  const status = sql(`select status from public.certificates where id='${id}'`).trim();
  notes.push(`revoked on screen: ${status}`);
  if (status !== "REVOKED") rec.verdict = "FAIL";
  // the learner
  const lc = await ctx();
  const l = await lc.newPage();
  try {
    await masukKartu(l, lulus);
    await l.goto(`${APP}/belajar/sertifikat`, { waitUntil: "networkidle" });
    await tutupTur(l);
    const daftar = norm(await bodyText(l));
    rec.shots.push(await shot(l, "s27v-daftar-murid"));
    const diDaftar = /Dicabut/.test(daftar);
    // as she would: the certificate's own row in her list opens it (after S27's new school year the chapter is no
    // longer assigned to her; the row still links, through her own sitting)
    const barisnya = l.locator(`a[href="/belajar/${tugas}/sertifikat"]`);
    const adaTautan = (await barisnya.count()) > 0;
    notes.push(`her list links that certificate: ${adaTautan}`);
    if (!adaTautan) rec.verdict = "FAIL";
    if (adaTautan) await barisnya.first().click(); else await l.goto(`${APP}/belajar/${tugas}/sertifikat`, { waitUntil: "networkidle" });
    await l.waitForURL((u) => u.pathname === `/belajar/${tugas}/sertifikat`, { timeout: SLOW }).catch(() => {});
    await l.getByText(/dicabut oleh penerbitnya|tidak ditemukan|tidak tersedia/i).first().waitFor({ timeout: SLOW }).catch(() => {});
    const isi = norm(await bodyText(l));
    rec.shots.push(await shot(l, "s27v-sertifikat-murid"));
    const banner = /Sertifikat ini sudah dicabut oleh penerbitnya/.test(isi);
    notes.push(`the learner's list says «Dicabut»: ${diDaftar}; her certificate page shows the revoked banner: ${banner}`);
    if (!diDaftar || !banner) rec.verdict = "FAIL";
  } finally { await lc.close(); }
  // a stranger, by the certificate's own link
  const vc = await ctx();
  const v = await vc.newPage();
  try {
    await v.goto(`${APP}/verifikasi/${token}`, { waitUntil: "networkidle" });
    const pub = norm(await bodyText(v));
    rec.shots.push(await shot(v, "s27v-verifikasi"));
    const ok = /Dicabut oleh penerbit/.test(pub);
    notes.push(`its public link says «Dicabut oleh penerbit»: ${ok}`);
    if (!ok) rec.verdict = "FAIL";
  } finally { await vc.close(); }
  return notes.join("; ");
});

await step("P1", "PUB-04: a random certificate token answers the closed not-found, anonymously", async (rec) => {
  const tok = `acak${Date.now()}`;
  const api = await fetch(`${APP}/api/verifikasi/${tok}`, { redirect: "manual" });
  const body = await api.text();
  const pc = await ctx();
  const p = await pc.newPage();
  await p.goto(`${APP}/verifikasi/${tok}`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(p, "verifikasi-random-token"));
  const txt = await bodyText(p);
  if (api.status !== 404 || !/"found"\s*:\s*false/.test(body)) rec.verdict = "FAIL";
  return `API ${api.status} ${body.slice(0, 60)} | page: ${txt.slice(0, 160)}`;
});

await step("P2", "PUB-02: a stranger cannot sign themselves up", async (rec) => {
  const r = await fetch(`${SB}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email: `stranger${Date.now()}@audit.pintar.test`, password: "Stranger-Pass-12345!" }),
  });
  const j = await r.json().catch(() => ({}));
  const refused = r.status >= 400 && /signup|disabled|not allowed/i.test(JSON.stringify(j));
  if (!refused) rec.verdict = "FAIL";
  return `HTTP ${r.status} ${JSON.stringify(j).slice(0, 140)}`;
});

await step("P3", "U-LOC: an unknown page shows PINTAR's own localized page, not a framework default", async (rec) => {
  const pc = await ctx();
  const p = await pc.newPage();
  // A path no release will ever build. It used to be /masuk/kartu, which was unknown until BOB-12 built it
  // (a GET there now redirects to /masuk, recorded below as BOB-12's own behaviour).
  const resp = await p.goto(`${APP}/halaman-yang-tidak-ada-${Date.now()}`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(p, "unknown-page"));
  const txt = await bodyText(p);
  const frameworkDefault = /This page could not be found|Application error/i.test(txt);
  // An anonymous visitor on a path outside the proxy's public list is sent to /masuk (200); signed in, it is PINTAR's 404.
  if (frameworkDefault) rec.verdict = "FAIL";
  const kartu = await p.goto(`${APP}/masuk/kartu`, { waitUntil: "networkidle" });
  const kartuDi = new URL(p.url()).pathname;
  return `HTTP ${resp?.status()} | framework default page: ${frameworkDefault} | text: ${txt.slice(0, 120)} | GET /masuk/kartu ends at ${kartuDi} (HTTP ${kartu?.status()})`;
});

// CR-90 (D-127, D-128; BD-11, J2.9 «the next person never continues as the last»; DG-19's security half). Browser
// Back after «Keluar», in three engines, on a computer declared personal and on one declared shared: the page of the
// session that ended must not come back, and after the next person signs in, Back shows only what that person may see.
await step("BD11", "BD-11: on a personal and on a shared computer, in Chromium, Firefox and WebKit, the school admin signs out with «Keluar» from deep in Konfigurasi and presses Back twice: no page of the ended session comes back, and no context is left on it; the teacher then signs in on the screen Back left and lands on their own home in their own context, never the admin's page, and presses Back: nothing of the admin's session shows (CR-90, J2.9; L3, D-132(e))", async (rec) => {
  const A = people.sdAdmin, B = people.guru;
  for (const x of [A, B]) if (!sudahAktif.has(x.email)) { rec.verdict = "BLOCKED"; return `${x.name} was never activated earlier in the walk`; }
  // L3 (D-132(e)): `diSini` signs in on the sign-in screen Back left this browser on, with whatever it carries
  const masuk = async (page, email, mode, diSini = false) => {
    if (!(diSini && new URL(page.url()).pathname === "/masuk")) await page.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await page.locator("#identitas").fill(email);
    await page.locator("#password").fill(sandiDari(email));
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
    if (new URL(page.url()).pathname === "/perangkat") {
      await page.locator(`input[type="radio"][name="mode"][value="${mode}"]`).check();
      await page.getByRole("button", { name: "Simpan pilihan" }).click();
      await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
      await page.waitForLoadState("networkidle");
    }
  };
  const mundur = async (page) => {
    await page.goBack({ waitUntil: "load", timeout: SLOW }).catch(() => null);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    return { di: new URL(page.url()).pathname, teks: await bodyText(page) };
  };
  const hasil = [];
  for (const [nama, mesin] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]]) {
    let br;
    try { br = await mesin.launch(); } catch (e) {
      rec.verdict = "BLOCKED"; hasil.push(`${nama}: cannot start (${String(e?.message ?? e).split("\n")[0]})`); continue;
    }
    for (const mode of ["PERSONAL", "SHARED"]) {
      const kc = await br.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
      const p = await kc.newPage();
      const catat = [];
      try {
        // the admin's session: a page that is theirs, deep in Konfigurasi, then «Keluar». Only this browser's sessions
        // are read below: the walk's own long-lived admin browser stays signed in elsewhere
        const t0 = sql("select now()::text").trim();
        await masuk(p, A.email, mode);
        await p.goto(`${APP}/konfigurasi/roles?bagian=roles#roles`, { waitUntil: "networkidle" });
        const sebelum = await bodyText(p);
        if (!sebelum.includes(A.name)) { rec.verdict = "BLOCKED"; catat.push(`the admin's page does not name ${A.name} before sign-out`); }
        await p.getByRole("button", { name: "Keluar", exact: true }).first().click();
        await p.waitForURL((u) => u.pathname === "/", { timeout: SLOW }).catch(() => {});
        await p.waitForLoadState("networkidle");
        // Back, twice: no page of the ended session comes back
        for (const kali of [1, 2]) {
          const m = await mundur(p);
          const bocor = m.teks.includes(A.name);
          catat.push(`back ${kali} → ${m.di}${bocor ? ` SHOWS ${A.name}` : ""}`);
          if (bocor) { rec.verdict = "FAIL"; rec.shots.push(await shot(p, `bd11-${nama}-${mode}-back${kali}`)); }
        }
        // L3 (D-132(e), §2.9): the admin's session ended with no context left on any of their rows
        const sisa = sql(`select count(*) from public.device_sessions d join auth.users u on u.id = d.auth_user_id
          where u.email = '${A.email}' and d.created_at >= '${t0}' and (d.ended_at is null or d.konteks_tujuan is not null)`).trim();
        catat.push(`the admin's open or context-holding sessions after «Keluar»: ${sisa}`);
        if (sisa !== "0") rec.verdict = "FAIL";
        // the next person signs in on the same browser, on the screen Back left it on; they land by their own door and
        // context, never on the admin's page (the stale continuation is not inherited), and Back shows nothing of it
        const tempatSebelum = new URL(p.url());
        await masuk(p, B.email, mode, true);
        const tiba = new URL(p.url()).pathname;
        // L3 (D-132 C9): what she holds decides where she arrives. Holding several (Mengajar, and Belajar once C-12 made
        // her a «Peserta»), she arrives on the chooser with no context and chooses; holding one, she lands on its home in
        // it directly: after S26b gave Kelas 1A to Bu Sari, that is Belajar. Never the admin's page or context
        let pintuB = [];
        if (tiba === "/") {
          pintuB = await p.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks").split(":")[0]));
          const k0 = sql(`select count(*) from public.device_sessions d join auth.users u on u.id = d.auth_user_id
            where u.email = '${B.email}' and d.ended_at is null and d.created_at >= '${t0}' and d.konteks_tujuan is not null`).trim();
          catat.push(`arrived on the chooser (doors ${JSON.stringify(pintuB)}; a context already set: ${k0 !== "0"})`);
          if (k0 !== "0" || pintuB.length < 2 || pintuB.includes("MENGELOLA")) rec.verdict = "FAIL";
          await keKonteks(p, pintuB.includes("MENGAJAR") ? { tujuan: "MENGAJAR", nama: "SD Zayd" } : { tujuan: "BELAJAR" });
        }
        const rumahB = new URL(p.url()).pathname;
        // the session this browser just made: the teacher's newest
        const konteksB = sql(`select coalesce(d.konteks_tujuan, '-') || ':' || coalesce(i.slug, case when d.konteks_platform then 'PLATFORM' else '-' end)
          from public.device_sessions d join auth.users u on u.id = d.auth_user_id left join public.institutions i on i.id = d.konteks_tempat
          where u.email = '${B.email}' and d.ended_at is null order by d.created_at desc limit 1`).trim();
        catat.push(`signed in from ${tempatSebelum.pathname}${tempatSebelum.search}; the teacher's own context ${konteksB}`);
        const sendiri = (rumahB === "/mengajar" && konteksB === "MENGAJAR:sd-zps") || (rumahB === "/belajar" && konteksB === "BELAJAR:-");
        if (!sendiri) rec.verdict = "FAIL";
        for (const kali of [1, 2, 3]) {
          const m = await mundur(p);
          const bocor = m.teks.includes(A.name);
          catat.push(`next person, back ${kali} → ${m.di}${bocor ? ` SHOWS ${A.name}` : ""}`);
          if (bocor) { rec.verdict = "FAIL"; rec.shots.push(await shot(p, `bd11-${nama}-${mode}-next-back${kali}`)); }
        }
        catat.unshift(`teacher's home ${rumahB}`);
      } catch (e) {
        rec.verdict = "FAIL"; catat.push(`error: ${String(e?.message ?? e).split("\n")[0]}`);
      }
      hasil.push(`${nama}/${mode}: ${catat.join("; ")}`);
      await kc.close();
    }
    await br.close();
  }
  return hasil.join(" | ");
});

// ───────────────────────────── L3: the working context (CR-83; D-127 Q1, Q2; D-132)
// Signs in through a door (`/masuk?pintu=…`) or none, with the address and password as the person would, the first
// «Komputer siapa ini?» answered as before (selesaikanMasuk). Returns where the sign-in landed, with its query.
async function masukLewat(page, email, pintu = null) {
  await page.goto(`${APP}/masuk${pintu ? `?pintu=${pintu}` : ""}`, { waitUntil: "networkidle" });
  await page.locator("#identitas").fill(email);
  await page.locator("#password").fill(sandiDari(email));
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await selesaikanMasuk(page, email);
  const u = new URL(page.url());
  return u.pathname + u.search;
}
// the chooser's doors as their pair keys, the places by short names; none when the page is not the chooser
const pintuDi = async (page) => new URL(page.url()).pathname !== "/" ? []
  : (await page.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks"))))
      .map((k) => k.replace(ids.sd, "SD").replace(ids.sma, "SMA").replace(/[0-9a-f]{8}-[0-9a-f-]{27}/, "PUSTAKA")).sort();
const pilihAlamat = (q) => `/?${new URLSearchParams(q).toString()}`;
const sesiKonteks = (email) => sql(`select coalesce(string_agg(coalesce(d.konteks_tujuan, '-') || ':' || coalesce(i.slug, case when d.konteks_platform then 'PLATFORM' else '-' end), ',' order by d.created_at), '')
  from public.device_sessions d join auth.users u on u.id = d.auth_user_id left join public.institutions i on i.id = d.konteks_tempat
  where u.email = '${email}' and d.ended_at is null`).trim();

// Design §4, row by row, for each person this world holds: a fresh browser each, the door pressed, signed in. With no
// door, one purpose · place is selected and several are asked (D-132(i)); a door whose purpose is not held lands on
// the chooser, which offers what is (its sentence is a semantic key awaiting Dr Gladys's words, so the address carries
// why: alasan=tidak_dipegang).
await step("L3D", "L3 (design §4; D-132 C4, C9): each door, for each person this world holds, lands where the door × person table says; with no door one purpose · place is selected and several are asked, never ranked", async (rec) => {
  const baris = [];
  const cek = async (label, masuk, harap, harapPintu = null) => {
    const kc = await ctx();
    const p = await kc.newPage();
    try {
      const di = await masuk(p);
      const pintu = await pintuDi(p);
      const ok = di === harap && (!harapPintu || JSON.stringify(pintu) === JSON.stringify([...harapPintu].sort()));
      if (!ok) { rec.verdict = "FAIL"; rec.shots.push(await shot(p, `l3d-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`)); }
      baris.push(`${label} → ${di}${pintu.length ? ` [${pintu.join(" ")}]` : ""}${ok ? "" : ` ✗ (expected ${harap}${harapPintu ? ` [${harapPintu.join(" ")}]` : ""})`}`);
    } catch (e) {
      rec.verdict = "FAIL";
      baris.push(`${label}: ${String(e?.message ?? e).split("\n")[0].slice(0, 160)}`);
    } finally {
      await kc.close();
    }
  };
  const TIDAK = (untuk) => pilihAlamat({ untuk, alasan: "tidak_dipegang" });
  const kartu = kartuKelas[1] ?? kartuKelas[0];
  if (!kartu) { rec.verdict = "BLOCKED"; return "no class card in this walk"; }
  const lewatKartu = (pintu) => async (p) => {
    await p.goto(`${APP}/masuk${pintu ? `?pintu=${pintu}` : ""}`, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Gunakan kartu kelas" }).click();
    await p.locator("#kartu").fill(kartu.number);
    await p.locator("#pin").fill(kartu.pin);
    await p.getByRole("button", { name: "Masuk dengan kartu" }).click();
    await p.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
    await p.waitForLoadState("networkidle");
    const u = new URL(p.url());
    return u.pathname + u.search;
  };
  // a learner (this walk's learners hold class cards: Belajar alone, the same pair an email learner holds, F22-K01)
  await cek("learner (card), «Saya mau belajar»", lewatKartu("belajar"), "/belajar");
  await cek("learner (card), «Saya mengajar»", lewatKartu("mengajar"), TIDAK("MENGAJAR"), ["BELAJAR"]);
  await cek("learner (card), «Saya mengelola sekolah»", lewatKartu("mengelola"), TIDAK("MENGELOLA"), ["BELAJAR"]);
  await cek("learner (card), no door", lewatKartu(null), "/belajar");
  // a teacher of one school: Bu Guru Sari, Kelas 1A's teacher since S26b
  const S = people.guru2.email;
  await cek("teacher, «Saya mau belajar»", (p) => masukLewat(p, S, "belajar"), "/belajar");
  await cek("teacher, «Saya mengajar»", (p) => masukLewat(p, S, "mengajar"), "/mengajar");
  await cek("teacher, «Saya mengelola sekolah»", (p) => masukLewat(p, S, "mengelola"), TIDAK("MENGELOLA"), ["MENGAJAR:SD"]);
  await cek("teacher, no door", (p) => masukLewat(p, S), "/mengajar");
  // a head of department (Mengajar and Mengelola in SD, HOD-08), appointed again in S27h
  const K = people.kaprodi.email;
  await cek("head of department, «Saya mengajar»", (p) => masukLewat(p, K, "mengajar"), "/mengajar");
  await cek("head of department, «Saya mengelola sekolah»", (p) => masukLewat(p, K, "mengelola"), "/pimpinan");
  await cek("head of department, no door", (p) => masukLewat(p, K), "/", ["MENGAJAR:SD", "MENGELOLA:SD"]);
  // Admin platform with no teaching appointment
  const pustaka = sql(`select id from public.institutions where tenant_kind='PLATFORM_CANONICAL' and is_active limit 1`).trim();
  const kelolaGladys = ["MENGELOLA:SD", "MENGELOLA:SMA", ...(pustaka ? ["MENGELOLA:PUSTAKA"] : []), "MENGELOLA:PLATFORM"];
  await cek("Admin platform, «Saya mau belajar»", (p) => masukLewat(p, GLADYS, "belajar"), "/belajar");
  await cek("Admin platform, «Saya mengajar»", (p) => masukLewat(p, GLADYS, "mengajar"), TIDAK("MENGAJAR"), kelolaGladys);
  await cek("Admin platform, «Saya mengelola sekolah»", (p) => masukLewat(p, GLADYS, "mengelola"), pilihAlamat({ untuk: "MENGELOLA" }), kelolaGladys);
  await cek("Admin platform, no door", (p) => masukLewat(p, GLADYS), "/", kelolaGladys);
  // a teacher who is also Admin sekolah: the platform admin makes the school admin Kelas 1 Biru's Guru on the screen
  // (Kelas 1A stays Bu Guru Sari's)
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SD Zayd" });
  const guru = await grantViaForm(g, people.sdAdmin.name, "EDUCATOR", "Kelas 1 Biru");
  baris.push(`Bu Admin SD made Guru of Kelas 1 Biru: ${guru.ok}`);
  if (guru.ok !== "ok") rec.verdict = "FAIL";
  const A = people.sdAdmin.email;
  await cek("teacher + Admin sekolah, «Saya mengajar»", (p) => masukLewat(p, A, "mengajar"), "/mengajar");
  await cek("teacher + Admin sekolah, «Saya mengelola sekolah»", (p) => masukLewat(p, A, "mengelola"), "/konfigurasi");
  await cek("teacher + Admin sekolah, no door", (p) => masukLewat(p, A), "/", ["MENGAJAR:SD", "MENGELOLA:SD"]);
  return baris.join("; ") + " (a learner who is also Admin sekolah is not in this world: F22-P01 holds that row)";
});

// Design §3, scenario A: Dr Gladys is Admin platform and also teaches in SD and SMA. On the laptop she works as
// «Saya mengajar · SMA», which stays through Akun saya and back; on the phone, at the same time, «Saya mengelola sekolah ·
// SD», then «Seluruh platform». Neither session ever moves the other; a page of another context is offered through the
// chooser and never switched to silently.
await step("L3A", "L3 scenario A (design §3; D-132 C3, C4): Admin platform who teaches in SD and SMA works as Mengajar · SMA on a laptop, kept through Akun saya and back, while her phone is Mengelola · SD and then «Seluruh platform»; neither session moves the other, and another context's page goes through the chooser", async (rec) => {
  const notes = [];
  const orang = (email) => sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${email}'`).trim();
  const gladysId = orang(GLADYS);
  const akar = (inst) => sql(`select id from public.org_nodes where institution_id='${inst}' and kind='INSTITUTION' limit 1`).trim();
  // her teaching appointments, granted by each school's own administrator through the database's grant (the screen's
  // own call, grant_role; nobody grants themselves, INV-16). SMA has no administrator yet: Gladys makes one on the
  // screens, as she did SD's in S3 and S4
  // BOB19-K01 (the owner's ruling of 8 Oct, Option B): SMA's first administrator, by «Menunjuk admin sekolah pertama»,
  // Admin sekolah at SMA's root as before; made in C12c when that ran first (pastikanAdminSma), else here
  const smaAdmin = SMA_ADMIN;
  const { np, angkat, sudah } = await pastikanAdminSma();
  notes.push(`«Orang baru» ${smaAdmin.name}: ${np.ok}${sudah ? " (in C12c)" : ""}`);
  await keKonteks(g, { tujuan: "MENGELOLA", nama: "SMA Zayd" });
  notes.push(`Admin sekolah of SMA: ${angkat.ok}${sudah ? " (in C12c)" : ""}`);
  const smaApi = await apiSession(smaAdmin.email);
  // SETUP (OPERATOR, declared, as W1): each school first has her as its own person, by an institutional ID as its
  // intake records a teacher, because a school-scoped role is granted only to a person the school already has (D-049).
  // SMA reserves its namespace here if no screen has yet
  sql(`update public.institutions set namespace = 'SMZ' where id = '${ids.sma}' and namespace is null
         and not exists (select 1 from public.institutions t where upper(t.namespace) = 'SMZ')`);
  const nomor = [ids.sd, ids.sma].map((inst) => sql(`select public.issue_institutional_id('${gladysId}', '${inst}')`).trim());
  notes.push(`SETUP (operator): her institutional IDs at SD and SMA: ${nomor.every((x) => /^[A-Z]{3}\d{6}[A-Z0-9]{2}$/.test(x))}`);
  const sampai = "2027-06-30T23:59:59+07:00";
  const g1 = await adminApi.rpc("grant_role", { p_person: gladysId, p_role: "EDUCATOR", p_scope_node: akar(ids.sd), p_valid_until: sampai });
  const g2 = await smaApi.rpc("grant_role", { p_person: gladysId, p_role: "EDUCATOR", p_scope_node: akar(ids.sma), p_valid_until: sampai });
  notes.push(`Guru in SD by SD's admin: ${g1.error ? `refused (${g1.error.message})` : "granted"}; in SMA by SMA's admin: ${g2.error ? `refused (${g2.error.message})` : "granted"}`);
  if (!np.ok || angkat.ok !== "ok" || g1.error || g2.error) { rec.verdict = "BLOCKED"; return notes.join("; "); }

  const laptopCtx = await ctx();
  const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  try {
    const L = await laptopCtx.newPage();
    const P = await phoneCtx.newPage();
    const tempat = async (page) => norm(await page.locator("[data-konteks-tempat]").first().innerText().catch(() => ""));
    // the laptop: no door, several held, so the chooser; she chooses Mengajar · SMA
    const tibaL = await masukLewat(L, GLADYS);
    const pintuL = await pintuDi(L);
    const keL = await keKonteks(L, { tujuan: "MENGAJAR", nama: "SMA Zayd" });
    notes.push(`laptop: signed in → ${tibaL} [${pintuL.join(" ")}]; chose Mengajar · SMA → ${keL}, the shell names «${await tempat(L)}»`);
    const adaMengajar = pintuL.includes("MENGAJAR:SD") && pintuL.includes("MENGAJAR:SMA") && pintuL.includes("MENGELOLA:PLATFORM");
    // the phone, at the same time: «Saya mengelola sekolah», several schools, so the chooser; she chooses SD
    const tibaP = await masukLewat(P, GLADYS, "mengelola");
    const keP = await keKonteks(P, { tujuan: "MENGELOLA", nama: "SD Zayd" });
    notes.push(`phone: «Saya mengelola sekolah» → ${tibaP}; chose Mengelola · SD → ${keP}, «${await tempat(P)}»`);
    // the laptop through Akun saya and back: still Mengajar · SMA
    await L.goto(`${APP}/akun`, { waitUntil: "networkidle" });
    const diAkun = await tempat(L);
    await L.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    const kembali = await tempat(L);
    notes.push(`laptop on Akun saya: «${diAkun}»; back on Mengajar: «${kembali}»`);
    // the phone moves to «Seluruh platform»; the laptop does not move
    const keP2 = await keKonteks(P, { tujuan: "MENGELOLA", platform: true });
    await L.reload({ waitUntil: "networkidle" });
    const setelah = await tempat(L);
    notes.push(`phone chose «Seluruh platform» → ${keP2}; the laptop reloaded reads «${setelah}»`);
    // a page of another context on the laptop: offered through the chooser, the laptop's context unchanged
    await L.goto(`${APP}/konfigurasi`, { waitUntil: "networkidle" });
    const lain = new URL(L.url());
    const pintuLain = await pintuDi(L);
    const sesi = sesiKonteks(GLADYS);
    notes.push(`laptop asks /konfigurasi → ${lain.pathname}${lain.search} [${pintuLain.join(" ")}]; Gladys's open sessions: ${sesi}`);
    rec.shots.push(await shot(L, "l3a-laptop-pemilih"), await shot(P, "l3a-phone"));
    const ok = tibaL === "/" && adaMengajar && keL === "/mengajar" && /SMA Zayd/.test(diAkun) && /SMA Zayd/.test(kembali) && /SMA Zayd/.test(setelah)
      && tibaP === pilihAlamat({ untuk: "MENGELOLA" }) && keP === "/konfigurasi" && keP2 === "/konfigurasi"
      && lain.pathname === "/" && lain.searchParams.get("lanjut") === "/konfigurasi" && !pintuLain.some((k) => k.startsWith("MENGAJAR"))
      && sesi.split(",").includes("MENGAJAR:sma-zps") && sesi.split(",").includes("MENGELOLA:PLATFORM");
    if (!ok) rec.verdict = "FAIL";
    // the Admin platform + teacher row of §4: the teaching door asks where; with no door, the chooser
    const kc = await ctx();
    const q = await kc.newPage();
    const pintuAjar = await masukLewat(q, GLADYS, "mengajar");
    const ajar = await pintuDi(q);
    await kc.close();
    notes.push(`§4 «Saya mengajar» → ${pintuAjar} [${ajar.join(" ")}]`);
    if (pintuAjar !== pilihAlamat({ untuk: "MENGAJAR" }) || JSON.stringify(ajar) !== JSON.stringify(["MENGAJAR:SD", "MENGAJAR:SMA"])) rec.verdict = "FAIL";
  } finally {
    await laptopCtx.close();
    await phoneCtx.close();
  }
  return notes.join("; ");
});

// The controlled red (EVIDENCE-MODEL §5): AUDIT_PLANT=journey adds one step
// that fails, so a run can show once that this harness turns the job red.
if (["journey", "both"].includes(process.env.AUDIT_PLANT)) {
  await step("PLANT", "planted failure: proves the harness goes red", async (rec) => { rec.verdict = "FAIL"; return "AUDIT_PLANT=journey"; });
}

await browser.close();
writeFileSync(join(OUT, "journey.json"), JSON.stringify({ ids, steps }, null, 2));
const tally = steps.reduce((m, s) => ((m[s.verdict] = (m[s.verdict] ?? 0) + 1), m), {});
console.log("TALLY", JSON.stringify(tally));

// The harness can fail (D-087, Phase 2): any FAIL or BLOCKED step turns the
// job red. A NOTE does not; it names something the candidate predates.
const red = steps.filter((s) => s.verdict === "FAIL" || s.verdict === "BLOCKED");
if (process.env.GITHUB_STEP_SUMMARY) {
  const cell = (t) => String(t ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 220);
  const rows = steps.map((s) => `| ${s.verdict} | ${s.id} | ${cell(s.title)} | ${cell(s.observed)} |`);
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, [`### Journey B: ${red.length ? `RED, ${red.length} step(s) FAIL or BLOCKED` : "GREEN"}`, "", `Tally: ${JSON.stringify(tally)}`, "", "| Verdict | Step | Title | Observed |", "|---|---|---|---|", ...rows, ""].join("\n"), { flag: "a" });
}
// The same verdicts as annotations: the API serves a job's annotations where its log and summary are not reachable
if (process.env.GITHUB_ACTIONS) {
  const esc = (t) => String(t ?? "").replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  const prop = (t) => esc(t).replace(/:/g, "%3A").replace(/,/g, "%2C");
  console.log(`::notice title=${prop("Journey B tally")}::${esc(JSON.stringify(tally))}`);
  console.log(`::notice title=${prop("Journey B verdicts")}::${esc(steps.map((s) => `${s.id} ${s.verdict}`).join(", "))}`);
  for (const s of steps.filter((x) => ["BD11", "L3D", "L3A", "C12k"].includes(x.id)))
    console.log(`::notice title=${prop(`Journey B ${s.id} ${s.verdict}`)}::${esc(String(s.observed ?? "").slice(0, 1500))}`);
  for (const s of red.slice(0, 10))
    console.log(`::error title=${prop(`Journey B ${s.id} ${s.verdict}`)}::${esc(`${s.title ?? ""} | ${s.observed ?? ""}`.slice(0, 1500))}`);
}
if (red.length) {
  console.log(`RED: ${red.map((s) => `${s.id} ${s.verdict}`).join(", ")}`);
  process.exitCode = 1;
}

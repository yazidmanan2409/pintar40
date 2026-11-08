// W6.10 (Batch 8; D-186): THE CLAUSES PROVEN ONLY OVER HTTP OR IN THE DATABASE, WALKED IN A REAL BROWSER against the
// seed. Every act is a click or a key. Time is the browser's simulated clock (Playwright's page.clock), never a wait;
// where the server keeps the time (the 60-minute lock), the session is aged in the database exactly as BOB29-A03 does,
// and that is said in the step.
//
//   J2.1   an address PINTAR does not know, on «Masuk»: the same sentence as a known address with a wrong password; the
//          page stays; no account is made
//   J2.9   «Keluar dari semua perangkat» on one computer ends the same person's session on another
//   J2.20  a shared computer left idle: the warning at four minutes, «PINTAR terkunci» at five; a wrong PIN says how many
//          tries are left and the right one returns to the page (J2.10's lock); three wrong PINs end the session (J2.10);
//          a session locked 60 minutes is ended on its next page (J2.10)
//
// Local or CI stack with the synthetic seed: APP_URL, SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, the anon key, APP_DIR,
// SUPABASE_DB_URL. Writes OUT_DIR/b8-jalan.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
// J2.18: the resend countdown helpers proven on staging (red on two plants, then green, 6 Oct), used as they are
import { mintaKodePemulihan, periksaHitungMundur } from "./staging/kode-ulang.mjs";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/b8-jalan";
const HANYA = (process.env.B8_HANYA ?? "").split(",").filter(Boolean);
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const GURU = { email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!", pin: "2817" };
const HOD = { email: "alpha-hod@synthetic.pintar.test", password: "Sintetis-AlphaHod-48!" };
const ADMIN = { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const PENILAI = { email: "penilai@evaluasi.pintar.test", password: "Penilai-Evaluasi-4417!" };
// the learning-cycle school's learner, whose class holds an open Uji Penguasaan that allows a pause (allows_pause) and
// offers help after its hesitation window; b5-ujung reads only this learner's lessons, and this walk runs last
const MURID = { email: "siklus-email@synthetic.pintar.test", password: "Sintetis-SiklusEmail-84!" };

mkdirSync(OUT, { recursive: true });
const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  if (HANYA.length && !HANYA.includes(id)) return;
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f) }).catch(() => null);
  rec.shots.push(f);
}
function sql(q) {
  const r = spawnSync("psql", ["-At", "-v", "ON_ERROR_STOP=1", "-c", q, DB], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`sql: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.email}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return { kue: [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" })), sesi: data.session };
}
/** A signed-in browser on a computer declared PERSONAL or SHARED; with jam, the page's clock is simulated from the start. */
async function masuk(browser, p, { mode = "PERSONAL", jam = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const { kue, sesi } = await cookies(p);
  await context.addCookies(kue);
  const page = await context.newPage();
  if (jam) await page.clock.install();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator(`input[type="radio"][name="mode"][value="${mode}"]`).check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  const lewati = page.getByRole("button", { name: /Lewati tur|Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  return { context, page, sesi };
}
const jalan = (page) => new URL(page.url()).pathname;
/** The Auth session id inside a session's access token. */
const sesiId = (sesi) => JSON.parse(Buffer.from(sesi.access_token.split(".")[1], "base64url").toString()).session_id;

const browser = await chromium.launch();
let sesiMurid = null;   // J6.4 leaves the Uji Penguasaan open for J6.7

await step("J2.1", "an address PINTAR does not know, on «Masuk»: the same answer as a wrong password, and nothing is made", async (rec) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "id-ID" });
  const page = await context.newPage();
  const asing = `tidak-ada-${Date.now()}@synthetic.pintar.test`;
  const coba = async (identitas, password) => {
    await page.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
    await page.locator("#identitas").fill(identitas);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    const alert = page.locator("#pw-err");   // LayarMasuk's one refusal line, tied to both fields
    await alert.waitFor({ timeout: SLOW });
    await page.waitForTimeout(300);
    return { teks: (await alert.innerText()).trim(), di: jalan(page) };
  };
  const tak = await coba(asing, "Salah-Sekali-1!");
  const salah = await coba(GURU.email, "Salah-Sekali-1!");
  harus(rec, tak.teks.length > 0 && tak.teks === salah.teks, `an unknown address and a wrong password answer the same sentence («${tak.teks.slice(0, 120)}»${tak.teks === salah.teks ? "" : ` vs «${salah.teks.slice(0, 120)}»`})`);
  harus(rec, tak.di === "/masuk" && salah.di === "/masuk", `both stay on /masuk (${tak.di}, ${salah.di})`);
  harus(rec, sql(`select count(*) from auth.users where lower(email) = lower(${lit(asing)})`) === "0", "no Auth user exists for the unknown address");
  await shot(page, rec, "masuk-asing");
  await context.close();
});

await step("J2.9", "«Keluar dari semua perangkat» on one computer ends the same person's session on another", async (rec) => {
  const laptop = await masuk(browser, HOD);
  const ponsel = await masuk(browser, HOD);
  await laptop.page.goto(`${APP}/akun`, { waitUntil: "networkidle" });
  harus(rec, jalan(laptop.page) === "/akun", `the laptop is signed in (${jalan(laptop.page)})`);
  await ponsel.page.goto(`${APP}/akun`, { waitUntil: "networkidle" });
  await ponsel.page.getByRole("button", { name: "Keluar dari semua perangkat" }).click();
  await ponsel.page.getByRole("button", { name: "Keluar dari semua", exact: true }).click();
  await ponsel.page.waitForURL((u) => u.pathname === "/masuk", { timeout: SLOW }).catch(() => {});
  harus(rec, jalan(ponsel.page) === "/masuk", `the phone pressed it and is on ${jalan(ponsel.page)}`);
  await laptop.page.goto(`${APP}/akun`, { waitUntil: "networkidle" });
  harus(rec, jalan(laptop.page) === "/masuk", `the laptop's next page is ${jalan(laptop.page)}, not its account`);
  harus(rec, sql(`select count(*) from public.device_sessions where session_id = ${lit(sesiId(laptop.sesi))} and ended_at is null`) === "0", "the laptop's own device session is ended in the database");
  await shot(laptop.page, rec, "keluar-semua");
  await laptop.context.close(); await ponsel.context.close();
});

await step("J2.20", "a shared computer left idle: warned at four minutes, locked at five; PIN wrong then right; three wrong end it; 60 minutes locked ends it", async (rec) => {
  // 1. the warning and the lock, on the browser's clock
  let s = await masuk(browser, GURU, { mode: "SHARED", jam: true });
  await s.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  harus(rec, jalan(s.page) === "/mengajar", `the teacher works on a shared computer (${jalan(s.page)})`);
  await s.page.clock.fastForward("04:10");
  const jaga = s.page.locator(".pin-jaga");
  await jaga.waitFor({ timeout: 10000 }).catch(() => {});
  harus(rec, await jaga.isVisible().catch(() => false), `after four minutes idle the warning shows («${(await jaga.innerText().catch(() => "")).trim().slice(0, 100)}»)`);
  await s.page.clock.fastForward("01:00");
  await s.page.waitForURL((u) => u.pathname === "/terkunci", { timeout: SLOW }).catch(() => {});
  harus(rec, jalan(s.page) === "/terkunci", `after five minutes the page is ${jalan(s.page)}`);
  // 2. a wrong PIN, then the right one
  await s.page.locator("#pin").fill("0000");
  await s.page.getByRole("button", { name: "Lanjutkan" }).click();
  const err = s.page.locator("#kunci-err");
  await err.waitFor({ timeout: SLOW });
  const sisa = (await err.innerText()).trim();
  harus(rec, /2/.test(sisa), `a wrong PIN says how many tries are left («${sisa.slice(0, 100)}»)`);
  await s.page.locator("#pin").fill(GURU.pin);
  await s.page.getByRole("button", { name: "Lanjutkan" }).click();
  await s.page.waitForURL((u) => u.pathname === "/mengajar", { timeout: SLOW }).catch(() => {});
  harus(rec, jalan(s.page) === "/mengajar", `the right PIN returns to the page (${jalan(s.page)})`);
  // 3. three wrong PINs end the session
  await s.page.clock.fastForward("05:10");
  await s.page.waitForURL((u) => u.pathname === "/terkunci", { timeout: SLOW }).catch(() => {});
  for (let i = 0; i < 3; i++) {
    await s.page.locator("#pin").fill("0000");
    await s.page.getByRole("button", { name: "Lanjutkan" }).click();
    await s.page.waitForTimeout(800);
  }
  const akhir = (await s.page.locator('[role="status"]').first().innerText().catch(() => "")).trim();
  harus(rec, /berakhir/i.test(akhir), `after three wrong PINs the screen says the session has ended («${akhir.slice(0, 100)}»)`);
  await s.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  harus(rec, jalan(s.page) === "/masuk", `and the next page is ${jalan(s.page)}`);
  await shot(s.page, rec, "tiga-pin");
  await s.context.close();
  // 4. 60 minutes locked: the server's own clock, aged in the database as BOB29-A03 does
  s = await masuk(browser, GURU, { mode: "SHARED", jam: true });
  await s.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  await s.page.clock.fastForward("05:10");
  await s.page.waitForURL((u) => u.pathname === "/terkunci", { timeout: SLOW }).catch(() => {});
  const sid = sesiId(s.sesi);
  harus(rec, Boolean(sid), "the locked session is known");
  sql(`update public.device_sessions set locked_at = now() - interval '61 minutes', last_activity_at = now() - interval '70 minutes' where session_id = ${lit(sid)}`);
  await s.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
  const u = new URL(s.page.url());
  harus(rec, u.pathname === "/masuk" && u.searchParams.get("sesi") === "berakhir", `a session locked 60 minutes is ended on its next page (${u.pathname}${u.search})`);
  harus(rec, sql(`select ended_reason from public.device_sessions where session_id = ${lit(sid)}`) === "KUNCI_HABIS", "the database records why it ended (KUNCI_HABIS)");
  await shot(s.page, rec, "enam-puluh-menit");
  await s.context.close();
});

await step("J6.4", "the learner finishes the Pemetaan Awal by the screens, starts the Uji Penguasaan, and is offered help after the question's hesitation window, and opens it", async (rec) => {
  const s = await masuk(browser, MURID);
  const tugas = sql(`select la.id from public.learning_assignments la join public.assessment_assignments aa on aa.learning_assignment_id = la.id
    join public.assessment_definitions d on d.id = aa.assessment_definition_id join public.institutions i on i.id = la.institution_id
    where i.slug like 'synth-siklus-%' and d.mode = 'POST_TEST' and d.allows_pause and aa.status = 'OPEN' limit 1`);
  if (!harus(rec, /^[0-9a-f-]{36}$/.test(tugas), `the class holds an Uji Penguasaan that allows a pause (${tugas || "none"})`)) return;
  const jendela = Number(sql(`select d.hesitation_window_seconds from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
    where aa.learning_assignment_id = ${lit(tugas)} and d.mode = 'POST_TEST' and d.allows_pause limit 1`));
  // the Pemetaan Awal, every question answered with its first option, then «Selesaikan pemetaan»
  await s.page.goto(`${APP}/belajar/${tugas}/pemetaan`, { waitUntil: "networkidle" });
  const mulaiPa = s.page.getByRole("button", { name: /^Mulai Pemetaan Awal$/ });
  if (await mulaiPa.count()) { await mulaiPa.click(); }
  for (let n = 0; n < 40; n++) {
    const stem = s.page.locator("h2.pin-stem").first();
    await stem.waitFor({ state: "visible", timeout: SLOW });
    const sebelum = await stem.innerText();
    await s.page.locator("ul.pin-opsi button.pin-op").first().click();
    await s.page.waitForFunction(() => document.querySelector("ul.pin-opsi button.pin-op")?.getAttribute("aria-pressed") === "true", null, { timeout: SLOW });
    const lanjut = s.page.getByRole("button", { name: "Berikutnya", exact: true });
    if (await lanjut.count()) {
      await lanjut.click();
      await s.page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, sebelum, { timeout: SLOW });
      continue;
    }
    await s.page.getByRole("button", { name: "Selesaikan pemetaan", exact: true }).click();
    await s.page.waitForURL((u) => !u.pathname.endsWith("/pemetaan"), { timeout: 60000 });
    break;
  }
  harus(rec, !jalan(s.page).endsWith("/pemetaan"), `the Pemetaan Awal is finished (now on ${jalan(s.page)})`);
  // the Uji Penguasaan
  await s.page.goto(`${APP}/belajar/${tugas}/penguasaan`, { waitUntil: "networkidle" });
  const mulaiUp = s.page.getByRole("button", { name: /^Mulai Uji Penguasaan$/ });
  if (await mulaiUp.count()) await mulaiUp.click();
  await s.page.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: SLOW });
  harus(rec, jalan(s.page).endsWith("/penguasaan"), `the Uji Penguasaan is open (${jalan(s.page)})`);
  // help: offered once the question has been on screen for the window (the server's clock), never before
  const bantuan = s.page.locator(".pin-bantuan");
  await s.page.waitForTimeout(Math.max(0, (jendela - 8) * 1000));
  harus(rec, !(await bantuan.isVisible().catch(() => false)), `no help is offered before ${jendela} s`);
  await bantuan.waitFor({ state: "visible", timeout: (jendela + 30) * 1000 }).catch(() => {});
  if (!harus(rec, await bantuan.isVisible().catch(() => false), `help is offered after the ${jendela}-second window («${(await bantuan.innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 100)}»)`)) return;
  await bantuan.locator("button").first().click();
  await s.page.locator(".pin-bantuan .pin-lvl").first().waitFor({ timeout: SLOW }).catch(() => {});
  harus(rec, (await s.page.locator(".pin-bantuan .pin-lvl").count()) > 0, `opening it shows a level of help («${(await s.page.locator(".pin-bantuan .pin-lvl").first().innerText().catch(() => "")).trim()}»)`);
  await shot(s.page, rec, "bantuan");
  sesiMurid = { ...s, tugas };
});

await step("J6.7", "the learner pauses the Uji Penguasaan with «Simpan & Jeda» and carries on with «Lanjutkan mengerjakan»", async (rec) => {
  if (!harus(rec, Boolean(sesiMurid), "the Uji Penguasaan from J6.4 is open")) return;
  const { page, tugas } = sesiMurid;
  const keadaan = () => sql(`select s.status from public.assessment_sessions s join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
    join public.assessment_definitions d on d.id = aa.assessment_definition_id join public.enrollments e on e.id = s.enrollment_id
    join public.accounts a on a.person_id = e.person_id join auth.users u on u.id = a.auth_user_id
    where aa.learning_assignment_id = ${lit(tugas)} and d.mode = 'POST_TEST' and u.email = ${lit(MURID.email)} order by s.created_at desc limit 1`);
  // a sitting is under way once an answer is saved (CREATED until then)
  await page.locator(".pin-bantuan").getByRole("button", { name: /Sudah cukup/ }).click().catch(() => {});
  await page.locator("ul.pin-opsi button.pin-op").first().click();
  const simpan = page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ });
  if (await simpan.count()) { await simpan.click(); await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW }).catch(() => {}); }
  harus(rec, keadaan() === "IN_PROGRESS", `before: the sitting is ${keadaan()}`);
  await page.getByRole("button", { name: "Simpan & Jeda", exact: true }).click();
  await page.getByRole("button", { name: "Lanjutkan mengerjakan", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
  harus(rec, (await page.getByRole("button", { name: "Lanjutkan mengerjakan", exact: true }).count()) === 1, "after «Simpan & Jeda» the button reads «Lanjutkan mengerjakan»");
  const jeda = keadaan();
  harus(rec, jeda === "PAUSED", `the database holds the sitting as ${jeda}`);
  await page.getByRole("button", { name: "Lanjutkan mengerjakan", exact: true }).click();
  await page.getByRole("button", { name: "Simpan & Jeda", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
  harus(rec, keadaan() === "IN_PROGRESS", `after «Lanjutkan mengerjakan» the sitting is ${keadaan()} and the question is still there`);
  await shot(page, rec, "jeda");
  await sesiMurid.context.close();
});

await step("J1.6", "maintenance as people meet it: the school's teacher is told in advance, is sent to the maintenance page when it starts, and works again when it ends", async (rec) => {
  const a = await masuk(browser, ADMIN);
  const g = await masuk(browser, GURU);
  const alpha = sql(`select i.id from public.institutions i join public.role_assignments r on r.institution_id = i.id
    join public.accounts ac on ac.person_id = r.person_id join auth.users u on u.id = ac.auth_user_id
    where u.email = ${lit(ADMIN.email)} and r.role = 'INSTITUTION_ADMIN' limit 1`);
  const jkt = (menit) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .format(new Date(Date.now() + menit * 60000)).replace(" ", "T");
  const alasan = `W6.10 J1.6 ${Date.now()}`;
  // the school admin schedules a window that starts in 30 minutes
  await a.page.goto(`${APP}/konfigurasi/pemeliharaan`, { waitUntil: "networkidle" });
  const jadwal = a.page.locator('section[aria-labelledby="pin-pm-jadwal"]');
  await jadwal.locator(`input[name="pm_sekolah"][value="${alpha}"]`).check();
  await jadwal.locator("#cfg-pm-mulai").fill(jkt(30));
  await jadwal.locator("#cfg-pm-selesai").fill(jkt(90));
  await jadwal.getByRole("button", { name: "Periksa waktu ini" }).click();
  await a.page.waitForURL((u) => u.searchParams.get("pm_cek") === "1", { timeout: SLOW });
  const langkah2 = a.page.locator('[data-tabrakan="1"]');
  await langkah2.waitFor({ timeout: SLOW });
  await langkah2.locator('input[name="alasan"]').fill(alasan);
  await langkah2.getByRole("button", { name: "Jadwalkan pemeliharaan" }).click();
  await a.page.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  const jendela = sql(`select id from public.maintenance_windows where reason = ${lit(alasan)} order by created_at desc limit 1`);
  if (!harus(rec, Boolean(jendela), "the window is scheduled")) return;
  try {
    // the teacher, in advance
    await g.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    const pita = g.page.locator('[data-pemeliharaan="1"]').first();
    harus(rec, await pita.isVisible().catch(() => false), `the teacher is told in advance («${(await pita.innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 140)}»)`);
    // the admin starts it now
    await a.page.goto(`${APP}/konfigurasi/pemeliharaan`, { waitUntil: "networkidle" });
    await a.page.locator(`li[data-jendela="${jendela}"] [data-buka-ubah]`).click();
    await a.page.waitForURL((u) => u.searchParams.get("ubah") === jendela, { timeout: SLOW });
    const terbuka = a.page.locator(`li[data-jendela="${jendela}"][data-terbuka]`);
    await terbuka.locator('input[name="alasan"]').fill("Mulai lebih awal (W6.10)");
    await terbuka.locator('button[name="aksi"][value="MULAI"]').click();
    await a.page.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
    harus(rec, sql(`select (starts_at <= now())::text from public.maintenance_windows where id = ${lit(jendela)}`) === "true", "the window has started");
    // the teacher's next page
    await g.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await g.page.waitForURL((u) => u.pathname === "/pemeliharaan", { timeout: 15000 }).catch(() => {});
    const judul = (await g.page.locator("h1").first().innerText().catch(() => "")).trim();
    harus(rec, jalan(g.page) === "/pemeliharaan" || /pemeliharaan/i.test(judul), `while it runs the teacher meets the maintenance page (${jalan(g.page)}, «${judul}»)`);
    await shot(g.page, rec, "pemeliharaan-berjalan");
    // the admin ends it
    await a.page.goto(`${APP}/konfigurasi/pemeliharaan?ubah=${jendela}#jendela-${jendela}`, { waitUntil: "networkidle" });
    const lagi = a.page.locator(`li[data-jendela="${jendela}"][data-terbuka]`);
    await lagi.locator('input[name="alasan"]').fill("Selesai (W6.10)");
    await lagi.locator("[data-bahaya-buka]").click();   // B4: the act asks first, in place
    await lagi.locator('button[name="aksi"][value="AKHIRI"]').click();
    await a.page.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
    harus(rec, sql(`select (ended_at is not null)::text from public.maintenance_windows where id = ${lit(jendela)}`) === "true", "the window has ended");
    await g.page.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    harus(rec, jalan(g.page) === "/mengajar", `after it ends the teacher works again (${jalan(g.page)})`);
  } finally {
    // never leave a window open for the rest of the run
    try { if (sql(`select (ended_at is null)::text from public.maintenance_windows where id = ${lit(jendela)}`) === "true") sql(`update public.maintenance_windows set ended_at = now(), end_reason = 'W6.10 cleanup' where id = ${lit(jendela)}`); } catch (e) { rec.catatan.push(`!! cleanup: ${e.message}`); }
    await a.context.close(); await g.context.close();
  }
});

await step("J2.18", "«Lupa password»: the resend countdown, for a real account beside a name nobody holds, holds then frees «Kirim ulang kode», and a resend starts it again, alike", async (rec) => {
  const buka = async () => { const c = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "id-ID" }); return { c, page: await c.newPage() }; };
  const nyata = await buka();
  const asing = await buka();
  try {
    await mintaKodePemulihan(nyata.page, APP, GURU.email);
    await mintaKodePemulihan(asing.page, APP, `tidak-ada-${Date.now()}`);
    const r = await periksaHitungMundur([{ nama: "real account", page: nyata.page }, { nama: "nobody", page: asing.page }]);
    for (const j of r.jejak) rec.catatan.push(`.. ${j}`);
    harus(rec, r.ok && r.masalah.length === 0, r.masalah.length ? r.masalah.join("; ") : "the two screens held, counted down, came free and answered a resend alike");
    await shot(nyata.page, rec, "kirim-ulang");
  } finally { await nyata.c.close(); await asing.c.close(); }
});

await step("J1.8", "an evaluation persona is kept out of identity: viewing as each persona the Hub offers, no page asks a device question or shows a password, a PIN, a username, a PINTAR ID or activation", async (rec) => {
  sql("update public.evaluation_sessions set ended_at = now(), ended_reason = 'EXITED' where ended_at is null");
  const s = await masuk(browser, PENILAI);
  await s.page.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" });
  const n = await s.page.locator('form[action*="/api/evaluation/assume"] button').count();
  if (!harus(rec, n >= 1, `the Hub offers ${n} persona(s) to view as`)) return;
  const IDENTITAS = /PINTAR ID|Nama pengguna|Username|Komputer siapa ini|Buat PIN|PIN pribadi|Aktifkan akun/i;
  for (let i = 0; i < n; i++) {
    await s.page.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" });
    const tombol = s.page.locator('form[action*="/api/evaluation/assume"] button').nth(i);
    const siapa = (await tombol.innerText()).replace(/\s+/g, " ").trim().slice(0, 60);
    await tombol.click();
    await s.page.waitForURL((u) => u.pathname !== "/evaluasi", { timeout: SLOW });
    await s.page.waitForLoadState("networkidle");
    const rumah = jalan(s.page);
    const temuan = [];
    for (const ke of ["/", rumah, "/akun", "/perangkat"]) {
      await s.page.goto(`${APP}${ke}`, { waitUntil: "networkidle" });
      const di = jalan(s.page);
      const teks = (await s.page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ");
      const sandi = await s.page.locator('input[type="password"], #pin, input[name="pin"], input[name="username"]').count();
      const keAktivasi = await s.page.locator('a[href^="/aktifkan"]').count();
      if (di === "/perangkat") temuan.push(`${ke} asks the device question`);
      if (sandi > 0) temuan.push(`${ke} → ${di} draws ${sandi} identity field(s)`);
      if (keAktivasi > 0) temuan.push(`${ke} → ${di} links to activation`);
      if (ke === "/akun") {
        // the account page refuses, and says why (its own sentence names what a persona has none of)
        if (!/tidak tersedia dalam MODE PERAGAAN/.test(teks)) temuan.push(`/akun → ${di} is not the demonstration refusal: «${teks.slice(0, 160)}»`);
        continue;
      }
      const m = IDENTITAS.exec(teks);
      if (m) temuan.push(`${ke} → ${di} says «${m[0]}»: «${teks.slice(Math.max(0, m.index - 80), m.index + 120)}»`);
    }
    harus(rec, temuan.length === 0, `as «${siapa}» (home ${rumah}): ${temuan.length ? temuan.join("; ") : "no device question, identity field or link to activation on /, the home or /perangkat, and /akun refuses with its reason"}`);
    await s.page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
    const band = s.page.locator('[role="region"][aria-label="MODE PERAGAAN"]');
    if (await band.count()) {
      await band.getByRole("button", { name: "Keluar dari peragaan" }).click();
      await s.page.waitForURL((u) => u.pathname === "/evaluasi", { timeout: SLOW }).catch(() => {});
    } else {
      sql("update public.evaluation_sessions set ended_at = now(), ended_reason = 'EXITED' where ended_at is null");
    }
  }
  await shot(s.page, rec, "persona");
  await s.context.close();
});

// LAST: it changes the head of department's recovery and ends their sessions; nothing after it needs them
await step("J2.12", "the PIN recovery ladder (an hour, four hours, suspended) by the screens, then the school admin's assisted reset on Keamanan akun ends the person's session", async (rec) => {
  const id = sql(`select p.pintar_id from auth.users u join public.accounts a on a.auth_user_id = u.id join public.persons p on p.id = a.person_id where u.email = ${lit(HOD.email)}`);
  if (!harus(rec, /^[A-Z0-9]{8}$/.test(id), `the head of department's PINTAR ID is known (${id})`)) return;
  const lewat = () => sql(`update public.recovery_ladder set locked_until = clock_timestamp() - interval '1 second' where typed_id = ${lit(id)}`);
  const tetap = await masuk(browser, HOD);
  await tetap.page.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
  harus(rec, jalan(tetap.page) === "/pimpinan", `the head of department is signed in elsewhere (${jalan(tetap.page)})`);
  const c = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: "id-ID" });
  const page = await c.newPage();
  await page.goto(`${APP}/masuk/lupa`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Pakai PINTAR ID dan PIN" }).click();
  // three wrong PINs. The device's own pace («Tunggu N detik/menit») is a separate safeguard, not the ladder this step
  // walks: it is cleared before each try (as BOB28-A02 asks each try from its own address), and if it still answers, it
  // is waited out and the try made again
  const tiga = async () => {
    let teks = "";
    for (let i = 0; i < 3; i++) {
      for (let ulang = 0; ulang < 4; ulang++) {
        sql("delete from public.identity_attempts where scope = 'RECOVERY_PIN'");
        if (!(await page.locator("#pin").isVisible().catch(() => false))) {
          await shot(page, rec, "tangga-tanpa-pin");
          rec.catatan.push(`.. no PIN field on the screen: «${(await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 200)}» buttons: ${(await page.locator("main button").evaluateAll((xs) => xs.map((x) => x.textContent.trim()))).join(" | ")}`);
          throw new Error("the PIN field is gone");
        }
        await page.locator("#id").fill(id, { timeout: SLOW });
        await page.locator("#pin").fill("0000", { timeout: SLOW });
        await page.getByRole("button", { name: "Lanjut", exact: true }).click({ timeout: SLOW });
        await page.locator("#pin-err").waitFor({ timeout: SLOW });
        await page.waitForTimeout(300);
        teks = (await page.locator("#pin-err").innerText()).trim();
        // only the device's own pace; the ladder's lock speaks of its hours too, and is what this step counts
        const tunggu = /^Terlalu banyak percobaan dari perangkat ini/.test(teks) ? /Tunggu (\d+) (detik|menit)/.exec(teks) : null;
        if (!tunggu) break;
        rec.catatan.push(`.. the device's pace: «${teks.slice(0, 80)}», waited`);
        await page.waitForTimeout((Number(tunggu[1]) * (tunggu[2] === "menit" ? 60 : 1) + 1) * 1000);
      }
    }
    return teks;
  };
  const tangga = () => sql(`select level || '|' || coalesce((locked_until > now())::text, 'f') || '|' || (suspended_at is not null)::text from public.recovery_ladder where typed_id = ${lit(id)}`);
  const satu = await tiga();
  const t1 = tangga();
  harus(rec, t1 === "1|true|false", `three wrong PINs lock it for the first rung (ladder ${t1}): «${satu.slice(0, 120)}»`);
  lewat();
  const dua = await tiga();
  const t2 = tangga();
  harus(rec, t2 === "2|true|false", `after that lock passes, three more lock it for the second, longer rung (ladder ${t2}): «${dua.slice(0, 120)}»`);
  lewat();
  const tigaKali = await tiga();
  const t3 = tangga();
  harus(rec, t3.endsWith("|true") && t3.split("|")[2] === "true", `three more suspend it (ladder ${t3}): «${tigaKali.slice(0, 120)}»`);
  harus(rec, await page.getByRole("button", { name: /email/i }).first().isVisible().catch(() => false) || /email/i.test(tigaKali), "the screen points to email recovery, which always works");
  await shot(page, rec, "tangga-pin");
  await c.close();
  // the school admin's assisted reset
  const a = await masuk(browser, ADMIN);
  await a.page.goto(`${APP}/konfigurasi/keamanan`, { waitUntil: "networkidle" });
  const kotak = a.page.locator('section[aria-labelledby="pin-keamanan-pin"]');
  await kotak.locator('input[name="id"]').fill(id);
  await kotak.getByRole("button", { name: "Lihat", exact: true }).click();
  await kotak.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  rec.catatan.push(`.. the record: «${(await kotak.locator("p").first().innerText()).replace(/\s+/g, " ").slice(0, 140)}»`);
  await kotak.locator('input[name="alasan"]').fill("Pemiliknya meminta bantuan (W6.10)");
  await kotak.getByRole("button", { name: "Atur ulang pemulihan PIN" }).click();
  const hasil = a.page.getByText(/sudah diatur ulang/);
  await hasil.waitFor({ timeout: SLOW }).catch(() => {});
  harus(rec, await hasil.isVisible().catch(() => false), "the admin is told the recovery is reset and every session of its owner ended");
  await shot(a.page, rec, "atur-ulang");
  await tetap.page.goto(`${APP}/pimpinan`, { waitUntil: "networkidle" });
  harus(rec, jalan(tetap.page) === "/masuk", `the head of department's other session is ended (${jalan(tetap.page)})`);
  await a.context.close(); await tetap.context.close();
});

await browser.close();
writeFileSync(join(OUT, "b8-jalan.json"), JSON.stringify(langkah, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);

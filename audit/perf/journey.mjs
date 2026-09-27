// U-PERF (D-046): a person's journey on staging, timed. Synthetic staff only (D-046(c)).
// Sign-in to a usable first screen; menu clicks; a representative save (renaming the synthetic school's
// Bagian and renaming it back, so each run leaves the data as it found it), timed twice: click to the
// button's own "saving" state (D-046(e): acknowledged at once) and click to the result line. Each step prints one JSON line with its window, so the
// coordinator can count Supabase requests per step from the log, and the Vercel function
// responses seen in the browser during the step (x-vercel-id ::sin1::).
import { chromium } from "playwright";

const APP = process.env.STAGING_ORIGIN;
const SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SERVICE_KEY;
const ANON = process.env.ANON_KEY;
const REPS = Number(process.env.REPS || 2);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const GURU_EMAIL = process.env.GURU_EMAIL;
const SLOW = 30000;

const out = [];
function line(o) { out.push(o); console.log(JSON.stringify(o)); }

// PINTAR's callback completes a sign-in only with the ?code= its own /masuk started (PKCE), and the real
// form would email the synthetic addresses. So the session is made on the server (Auth's verify, as
// staging-perf-seed does) and set as PINTAR's own session cookie (@supabase/ssr: sb-<ref>-auth-token,
// "base64-" + base64url(JSON), chunked at 3180); the timed step is opening "/" until the reader's home is
// usable. The callback's one code exchange is the only part of a real sign-in not timed here.
const REF = new URL(SB).hostname.split(".")[0];
async function session(email) {
  const g = await fetch(`${SB}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const gj = await g.json();
  const th = gj.hashed_token || gj.properties?.hashed_token;
  if (!th) throw new Error(`no sign-in token (HTTP ${g.status})`);
  const v = await fetch(`${SB}/auth/v1/verify`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: th }),
  });
  const sj = await v.json();
  if (!sj.access_token) throw new Error(`verify failed (HTTP ${v.status})`);
  return sj;
}
function sessionCookies(sess) {
  const key = `sb-${REF}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
  const host = new URL(APP).hostname;
  const base = { domain: host, path: "/", secure: true, sameSite: "Lax", httpOnly: false };
  if (value.length <= 3180) return [{ ...base, name: key, value }];
  const out = [];
  for (let i = 0, n = 0; i < value.length; i += 3180, n++) out.push({ ...base, name: `${key}.${n}`, value: value.slice(i, i + 3180) });
  return out;
}

function watch(page) {
  const seen = [];
  page.on("response", (res) => {
    const id = res.headers()["x-vercel-id"];
    if (id && res.url().startsWith(APP)) seen.push({ id, url: new URL(res.url()).pathname, status: res.status() });
  });
  return seen;
}

async function step(page, seen, role, rep, name, act) {
  const before = seen.length;
  const t0 = Date.now();
  const start = new Date(t0).toISOString();
  let ok = true, note = "";
  try { note = (await act()) || ""; } catch (e) { ok = false; note = String(e.message || e).slice(0, 200); }
  const t1 = Date.now();
  const fn = seen.slice(before).filter((s) => s.id.split("::").length === 3);
  line({ role, rep, step: name, ok, ms: t1 - t0, start, end: new Date(t1).toISOString(),
         vercel_function_responses: fn.length, regions: [...new Set(fn.map((s) => s.id.split("::")[1]))], note });
  // a failed step leaves the page somewhere else: the rest of this journey would only time out
  if (!ok) throw new Error(`stopped after "${name}"`);
}

async function usable(page, path) {
  await page.waitForURL((u) => u.pathname === path, { timeout: SLOW, waitUntil: "commit" });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
}

async function clickTo(page, href, path = href.split("?")[0]) {
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await usable(page, path);
}

// A person's first visit to a surface opens its tour, and the tour holds the page until it is closed.
// Closed once as "Lewati" (skip), which PINTAR records against the person, so later visits are those of
// a returning user. Not timed; one line says whether it was there.
async function closeTour(page, seen, role, rep) {
  const card = page.locator('.pin-tur-kartu[role="dialog"]');
  const there = await card.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false);
  if (!there) return;
  await card.locator("button.pin-tur-x").last().click();
  await card.waitFor({ state: "detached", timeout: SLOW });
  line({ role, rep, step: "first-visit tour closed (not timed)", ok: true });
}

// A save, timed twice: from the click to the button showing its own "saving" state (TombolKirim sets
// aria-busy and disabled while the form is pending), and from the click to the result line.
async function save(page, button, result) {
  await button.waitFor({ state: "visible", timeout: SLOW });
  const ack = button.evaluate((b) => new Promise((done) => {
    let t0 = null;
    b.addEventListener("click", () => { t0 = performance.now(); }, { capture: true, once: true });
    const obs = new MutationObserver(() => {
      if (t0 !== null && (b.disabled || b.getAttribute("aria-busy") === "true")) { obs.disconnect(); done(Math.round(performance.now() - t0)); }
    });
    obs.observe(b, { attributes: true, childList: true, subtree: true, characterData: true });
    setTimeout(() => { obs.disconnect(); done(null); }, 30000);
  }));
  const t = Date.now();
  await button.click();
  await result.waitFor({ state: "visible", timeout: SLOW });
  const resultMs = Date.now() - t;
  const ackMs = await ack;
  return `click→saving ${ackMs === null ? "never shown" : `${ackMs} ms`}; click→result ${resultMs} ms`;
}

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function rename(page, from, to) {
  const head = page.locator(".pin-str-kepala").filter({ has: page.locator("strong.pin-str-nama", { hasText: new RegExp(`^${esc(from)}$`) }) }).first();
  await head.waitFor({ state: "visible", timeout: SLOW });
  await head.getByRole("button", { name: "Ubah nama" }).click();
  const form = page.locator("form.pin-str-ubah");
  await form.locator('input[name="nama"]').fill(to);
  // the line that ENDS with the new name: renaming back, the previous line ("… Bagian Uji Kinerja (diukur).")
  // also contains it
  return save(page, form.getByRole("button", { name: "Simpan" }), page.getByRole("status").filter({ hasText: new RegExp(`${esc(to)}\\.?\\s*$`) }).first());
}

async function signIn(page, email, landing) {
  await page.context().addCookies(sessionCookies(await session(email)));
  const t = Date.now();
  // where the callback's own redirect (tujuanMasuk) sends this reader; "/" itself does not redirect
  await page.goto(`${APP}${landing}`, { timeout: SLOW });
  await usable(page, landing);
  return `home ${new URL(page.url()).pathname} usable ${Date.now() - t} ms after opening it`;
}

async function admin(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "admin";
  await step(page, seen, R, rep, "sign-in → Konfigurasi", () => signIn(page, ADMIN_EMAIL, "/konfigurasi"));
  await closeTour(page, seen, R, rep);
  await step(page, seen, R, rep, "click Aktivasi akun", () => clickTo(page, "/aktivasi"));
  await step(page, seen, R, rep, "back to Konfigurasi", async () => { await page.goBack(); await usable(page, "/konfigurasi"); });
  await step(page, seen, R, rep, "click Studio", () => clickTo(page, "/studio"));
  await step(page, seen, R, rep, "click Buat Paket", () => clickTo(page, "/studio/unggah"));
  await step(page, seen, R, rep, "click Antrean Tinjauan", () => clickTo(page, "/studio/tinjau"));
  await step(page, seen, R, rep, "click Bank Soal", () => clickTo(page, "/studio/bank"));
  await step(page, seen, R, rep, "open Konfigurasi", async () => { await page.goto(`${APP}/konfigurasi`, { timeout: SLOW }); await usable(page, "/konfigurasi"); });
  await step(page, seen, R, rep, "click Ringkasan sekolah", async () => {
    const a = page.locator('a[href^="/dekan/ringkasan"]').first();
    await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(page, "/dekan/ringkasan");
  });
  // the save: rename the synthetic school's Bagian and rename it back (Konfigurasi → Struktur sekolah)
  const BAGIAN = "Bagian Uji Kinerja", SEMENTARA = "Bagian Uji Kinerja (diukur)";
  await page.goto(`${APP}/konfigurasi#struktur`, { timeout: SLOW });
  await usable(page, "/konfigurasi");
  await step(page, seen, R, rep, "save: Ubah nama", () => rename(page, BAGIAN, SEMENTARA));
  await step(page, seen, R, rep, "save: Ubah nama back", () => rename(page, SEMENTARA, BAGIAN));
  await ctx.close();
}

async function guru(browser, rep) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seen = watch(page);
  const R = "guru";
  await step(page, seen, R, rep, "sign-in → Mengajar", () => signIn(page, GURU_EMAIL, "/mengajar"));
  await closeTour(page, seen, R, rep);
  let kelas = null;
  await step(page, seen, R, rep, "click Kelas Uji Kinerja A", async () => {
    const a = page.locator('a[href^="/mengajar/"]').filter({ hasText: "Kelas Uji Kinerja A" }).first();
    await a.waitFor({ state: "visible", timeout: SLOW });
    kelas = await a.getAttribute("href");
    await a.click(); await usable(page, kelas.split("?")[0]);
  });
  if (kelas) {
    await closeTour(page, seen, R, rep);
    await step(page, seen, R, rep, "click Siapkan", async () => {
      const a = page.locator(`a[href^="${kelas}/siapkan"]`).first();
      await a.waitFor({ state: "visible", timeout: SLOW }); await a.click(); await usable(page, `${kelas}/siapkan`);
    });
    await step(page, seen, R, rep, "back to the class", async () => { await page.goBack(); await usable(page, kelas); });
  }
  await ctx.close();
}

const browser = await chromium.launch();
for (let rep = 1; rep <= REPS; rep++) {
  await admin(browser, rep).catch((e) => line({ role: "admin", rep, step: "journey", ok: false, note: String(e.message || e).slice(0, 200) }));
  await guru(browser, rep).catch((e) => line({ role: "guru", rep, step: "journey", ok: false, note: String(e.message || e).slice(0, 200) }));
}
await browser.close();

console.log("\nSUMMARY (ms): step — rep1, rep2, …");
const by = new Map();
for (const o of out.filter((x) => x.ms !== undefined)) {
  const k = `${o.role} | ${o.step}`; if (!by.has(k)) by.set(k, []); by.get(k).push(o.ok ? o.ms : `FAIL(${o.ms})`);
}
for (const [k, v] of by) console.log(`${k.padEnd(48)} ${v.join(", ")}`);

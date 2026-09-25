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

import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP_URL;
const SB = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB = process.env.SUPABASE_DB_URL;
const MAIL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const OUT = process.env.OUT_DIR ?? "audit-out/journey";
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
  console.log(`${rec.verdict.padEnd(8)} ${id.padEnd(5)} ${title} :: ${String(rec.observed ?? "").slice(0, 300)}`);
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

// sign in the way a person does: type the address, press the button, open the email
async function magicSignIn(page, email) {
  const t0 = new Date(Date.now() - 1000);
  await page.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await page.getByText("Periksa email Anda").waitFor({ timeout: 15000 });
  const { link, subject } = await latestLink(email, t0);
  if (!link) throw new Error("no sign-in email arrived");
  await page.goto(link, { waitUntil: "networkidle" });
  await page.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  return { landed: new URL(page.url()).pathname, subject };
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
async function newPerson(page, name, email) {
  const r = await page.request.post(`${APP}/api/akun/aktivasi`, { data: { mode: "NEW_PERSON", display_name: name, email } });
  return { status: r.status(), body: await r.json().catch(() => null) };
}
async function grantViaForm(page, personName, roleValue, scopeLabelPart, until = "2027-06-30") {
  // a real load every time: a hash-only change on the same path keeps a stale person list
  await page.goto(`${APP}/konfigurasi?muat=${Date.now()}#roles`, { waitUntil: "networkidle" });
  const form = page.locator("form").filter({ has: page.locator('select[name="person"]') });
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
async function hasSignOut(page) {
  return (await page.locator('form[action="/keluar"], a[href="/keluar"], button:has-text("Keluar")').count()) > 0;
}

// ───────────────────────────── world: production posture from an empty database
const GLADYS = "gladys@audit.pintar.test";
const people = {
  sdAdmin: { name: "Bu Admin SD", email: "admin.sd@audit.pintar.test" },
  guru: { name: "Pak Guru Budi", email: "guru.budi@audit.pintar.test" },
  kaprodi: { name: "Bu Kepala Dept", email: "kepala.dept@audit.pintar.test" },
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
  ids.period = sql(`select id from public.academic_periods where institution_id='${ids.sd}'`);
  return `environment=${sql("select environment from public.platform_environment")}; schools=${sql("select string_agg(slug||':'||is_synthetic,',') from public.institutions order by 1")}`;
});

const browser = await chromium.launch();
const ctx = () => browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
const gladysCtx = await ctx();
const g = await gladysCtx.newPage();

await step("S1", "Gladys signs in with the email link (same browser)", async (rec) => {
  const r = await magicSignIn(g, GLADYS);
  rec.shots.push(await shot(g, "gladys-after-signin"));
  if (!["/konfigurasi", "/"].includes(r.landed)) rec.verdict = "FAIL";
  return `landed on ${r.landed}; email subject "${r.subject}"`;
});

await step("S1b", "the same link opened in a different browser", async (rec) => {
  const other = await ctx();
  const p = await other.newPage();
  const t0 = new Date(Date.now() - 1000);
  const asker = await (await ctx()).newPage();
  await asker.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await asker.locator("#email").fill(GLADYS);
  await asker.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await asker.getByText("Periksa email Anda").waitFor({ timeout: 15000 });
  const { link } = await latestLink(GLADYS, t0);
  await p.goto(link, { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  rec.shots.push(await shot(p, "link-in-other-browser"));
  const t = await bodyText(p);
  const signedIn = !/masuk|tautan/i.test(new URL(p.url()).pathname) && !/tidak berlaku/i.test(t);
  if (!signedIn) rec.verdict = "NOTE";
  await other.close();
  return `ended at ${new URL(p.url()).pathname}; screen says: ${t.slice(0, 200)}`;
});

await step("S2", "Gladys finds her way to account activation from Konfigurasi", async (rec) => {
  await g.goto(`${APP}/konfigurasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "konfigurasi-gladys"));
  const links = await g.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  const toAktivasi = links.some((h) => h?.startsWith("/aktivasi"));
  const toStudio = links.some((h) => h?.startsWith("/studio"));
  if (!toAktivasi || !toStudio) rec.verdict = "FAIL";
  return `link to /aktivasi: ${toAktivasi}; link to /studio: ${toStudio}; sign-out control: ${await hasSignOut(g)}`;
});

await step("S3", "Gladys creates the school admin (Orang baru di luar pendataan)", async (rec) => {
  await g.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "aktivasi-gladys"));
  const before = await mailCount(people.sdAdmin.email);
  const r = await newPerson(g, people.sdAdmin.name, people.sdAdmin.email);
  const after = await mailCount(people.sdAdmin.email);
  if (!r.body?.ok) rec.verdict = "FAIL";
  return `HTTP ${r.status} ${JSON.stringify(r.body)}; emails sent to the new admin: ${after - before}`;
});

await step("S4", "Gladys grants Admin sekolah at SD's root (Konfigurasi → Peran & akses)", async (rec) => {
  const r = await grantViaForm(g, people.sdAdmin.name, "INSTITUTION_ADMIN", "SD Zayd");
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
  await a.goto(`${APP}/konfigurasi#roles`, { waitUntil: "networkidle" });
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

await step("S7", "the school admin builds SD's structure on a screen (Bagian, Tingkat, Kelas)", async (rec) => {
  await a.goto(`${APP}/konfigurasi#struktur`, { waitUntil: "networkidle" });
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
  if (!kl || hidden) rec.verdict = "FAIL";
  const ladder = kl ? sql(`with recursive up as (select id, parent_id, kind::text k, 1 n from public.org_nodes where id='${kl}' union all select o.id, o.parent_id, o.kind::text, up.n + 1 from public.org_nodes o join up on o.id = up.parent_id) select string_agg(k, ' <- ' order by n) from up`).trim() : "-";
  return `${steps.join("; ")}; ladder: ${ladder}`;
});

await step("S7b", "Gladys (platform admin) opens Struktur sekolah: which school is chosen first?", async (rec) => {
  await g.goto(`${APP}/konfigurasi#struktur`, { waitUntil: "networkidle" });
  if (!(await g.locator("div.pin-str-tambah-bagian form").count())) { rec.verdict = "NOTE"; return "no Struktur sekolah panel"; }
  const chosen = (await g.locator('#struktur [aria-current="page"]').first().textContent().catch(() => null)) ?? "(single school)";
  const offered = await g.locator("#struktur nav a").allTextContents().catch(() => []);
  if (/Kurikulum Nasional/i.test(chosen) || offered.some((o) => /Kurikulum Nasional/i.test(o))) rec.verdict = "FAIL";
  return `preselected: "${chosen.trim()}"; offered: ${JSON.stringify(offered)}`;
});

let adminApi;
await step("S8", "intake with only the school's root as 'Tempat' (all a new school has)", async (rec) => {
  adminApi = await apiSession(people.sdAdmin.email);
  const ns = await adminApi.rpc("reserve_institution_namespace", { p_institution: ids.sd, p_namespace: "SDZ" });
  if (ns.error) throw new Error(`reserve code: ${ns.error.message}`);
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
  const failed = sql(`select count(*) from public.import_rows r where r.job_id='${job.data}' and r.state::text <> 'PROVISIONED'`);
  if (Number(failed) > 0) rec.verdict = "FAIL";
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
await step("S10", "the school admin makes a class card for a student (/aktivasi)", async (rec) => {
  await a.goto(`${APP}/aktivasi`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(a, "aktivasi-admin"));
  const waiting = await adminApi.rpc("persons_awaiting_account");
  const ani = (waiting.data ?? []).find((p) => /Ani/.test(p.display_name));
  if (!ani) throw new Error(`Ani is not waiting for an account; waiting: ${JSON.stringify(waiting.data ?? waiting.error?.message).slice(0, 200)}`);
  const r = await a.request.post(`${APP}/api/akun/aktivasi`, { data: { mode: "CLASSROOM_CARD", person_id: ani.person_id } });
  const body = await r.json().catch(() => null);
  if (!body?.ok) { rec.verdict = "FAIL"; return `HTTP ${r.status()} ${JSON.stringify(body)}`; }
  card = { number: body.card, pin: body.pin };
  return `card made (number ${String(body.card).length} digits, PIN ${String(body.pin).length} digits)`;
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

await step("S12", "Gladys creates a teacher and grants Guru at Kelas 1A", async (rec) => {
  const np = await newPerson(g, people.guru.name, people.guru.email);
  if (!np.body?.ok) throw new Error(JSON.stringify(np.body));
  const r = await grantViaForm(g, people.guru.name, "EDUCATOR", "Kelas 1A");
  rec.shots.push(await shot(g, "grant-guru-result"));
  if (r.ok !== "ok") rec.verdict = "FAIL";
  return JSON.stringify(r);
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
  if (!sees) rec.verdict = "FAIL";
  return `landed on ${r.landed}; sees Kelas 1A: ${sees}; sign-out control: ${await hasSignOut(t)}; siapkan says: ${siapkan}`;
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
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
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
  return { chosen, hasil: u.searchParams.get("hasil"), detail: u.searchParams.get("detail") };
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
  const batch = /^[0-9a-f-]{36}$/.test(r.detail ?? "") ? r.detail : null;
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

await step("S15b", "D-029: a package addressed to the canonical library is refused", async (rec) => {
  const inst = sql(`select id from public.institutions where tenant_kind='PLATFORM_CANONICAL' limit 1`).trim();
  if (!inst) { rec.verdict = "NOTE"; return "no canonical tenant in this database"; }
  const before = hitung(inst);
  // Since DAISY-06 the page no longer offers the library at all (M8), so the server's own
  // refusal is proved with a request the page would never build.
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  const offered = (await g.locator("select option").filter({ hasText: "Kurikulum Nasional" }).count()) > 0;
  const r = offered ? await kirimPaket("Kurikulum Nasional", paketContoh ?? paketLama)
                    : await kirimPaket("Kurikulum Nasional", paketContoh ?? paketLama, inst);
  const after = hitung(inst);
  if (!r.chosen) rec.verdict = "NOTE";
  else if (after.courses !== before.courses || r.hasil === "ok") rec.verdict = "FAIL";
  return `offered on the page: ${offered}; ${offered ? "chosen" : "forged request"} → hasil=${r.hasil} detail=${r.detail}; canonical courses ${before.courses} → ${after.courses}`;
});

// Real content: SD Kelas 5 Matematika Bab 1, from docs/onboarding/konten/SD5-Matematika-Bab1.xlsx,
// converted by the app's own bukuKerjaKePaket. Imported through today's page into SD, then its
// course page is captured, so the chapter can be seen before any school has it.
await step("S15c", "SD 5 Matematika Bab 1 (real content) imports whole into SD", async (rec) => {
  const f = new URL("./fixtures/sd5-matematika-bab1.paket.json", import.meta.url);
  if (!existsSync(f) || !paketContoh) { rec.verdict = "NOTE"; return "candidate predates BOB-02, or the chapter fixture is absent"; }
  const before = hitung(ids.sd);
  const r = await kirimPaket("SD Zayd", readFileSync(f, "utf8"));
  const notes = [`submit → hasil=${r.hasil} detail=${r.detail}`];
  const batch = /^[0-9a-f-]{36}$/.test(r.detail ?? "") ? r.detail : null;
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
  if (!course || Number(items) !== 28) rec.verdict = "FAIL";
  return notes.join("; ");
});

await step("S16", "Head of department: sees reports on /pimpinan", async (rec) => {
  const np = await newPerson(g, people.kaprodi.name, people.kaprodi.email);
  if (!np.body?.ok) throw new Error(JSON.stringify(np.body));
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
const babSatu = () => sql(`select id from public.courses where institution_id='${ids.sd}' and title like 'Matematika Kelas 5%' order by created_at desc limit 1`).trim();
const keadaanBab = (c) => sql(`select c.status || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id='${c}'`).trim();
let terbitBab = false;

// the package page's own words from the step list on, for a record of what it said
const kataLangkah = async (page) => { const t = await bodyText(page); const i = t.indexOf("Langkah menuju terbit"); return (i >= 0 ? t.slice(i) : t).slice(0, 320); };
const siap = (c) => sql(`select status || ' | ' || coalesce(array_to_string(blockers, '; '), '') from public.publish_readiness('${c}')`).trim();

await step("S17", "Studio to Terbit with two people: Bab 1 through the seven steps (DAISY-06, BOB-03)", async (rec) => {
  const course = babSatu();
  if (!course) { rec.verdict = "BLOCKED"; return "S15c left no Bab 1 course"; }
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  if (!(await g.getByRole("button", { name: TERBIT[0][1] }).count()) && !/Langkah menuju terbit/i.test(await bodyText(g))) {
    rec.verdict = "NOTE"; return `this candidate has no Langkah menuju terbit on the package page (state ${keadaanBab(course)})`;
  }
  const notes = [`start ${keadaanBab(course)}`];
  // press a step's button as `page`; the state it moved to, or null when nothing moved
  const tekan = async (page, kunci, tombol) => {
    await page.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
    const btn = page.getByRole("button", { name: tombol, exact: true });
    if (!(await btn.count())) return { tidakAda: true };
    const before = keadaanBab(course);
    await btn.first().click();
    let after = before;
    for (let i = 0; i < 40 && after === before; i++) { await page.waitForTimeout(500); after = keadaanBab(course); }
    await page.waitForLoadState("networkidle");
    rec.shots.push(await shot(page, `terbit-${kunci}${after === before ? "-ditolak" : ""}`));
    return { after: after === before ? null : after };
  };
  for (const [kunci, tombol, siapa] of TERBIT) {
    const page = siapa === "g" ? g : a;
    if (siapa === "a" && ["setujui", "kunci"].includes(kunci)) {
      // a second person's step: the author must not be offered it
      await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
      if (await g.getByRole("button", { name: tombol, exact: true }).count()) { notes.push(`!! the author is offered "${tombol}"`); rec.verdict = "FAIL"; }
    }
    if (kunci === "terbitkan") {
      // publishing wants every content-check finding reviewed (publish_readiness)
      const mutu = sql(`select coalesce(string_agg(severity || ' ' || pattern_class || ' x' || n, ', ' order by severity, pattern_class), 'none')
        from (select severity::text, pattern_class, count(*) n from public.mcq_quality_findings where course_id='${course}' group by 1, 2) x`).trim();
      const teks = sql(`select coalesce(string_agg(severity || ' x' || n, ', '), 'none') from (select severity::text, count(*) n from public.coaching_findings where course_id='${course}' group by 1) x`).trim();
      notes.push(`findings on Bab 1: question quality ${mutu}; student text ${teks}`);
      const r0 = siap(course);
      notes.push(`readiness: ${r0}`);
      if (!r0.startsWith("READY")) {
        const t = await tekan(g, kunci, tombol);
        notes.push(`publishing before the review: ${t.tidakAda ? "no button" : t.after ? `moved to ${t.after} (!!)` : `refused; the page says: ${await kataLangkah(g)}`}`);
        if (t.after) { rec.verdict = "FAIL"; return notes.join("; "); }
        if (r0.startsWith("BLOCKED")) { rec.verdict = "FAIL"; notes.push("ERROR findings: the content must be corrected before it can be published"); return notes.join("; "); }
        // the second person reviews each WARNING on the package page
        let reviewed = 0;
        for (let i = 0; i < 60; i++) {
          await a.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
          const ack = a.getByRole("button", { name: "Sudah saya tinjau", exact: true });
          if (!(await ack.count())) break;
          const open = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id='${course}' and acknowledged_at is null)
            + (select count(*) from public.coaching_findings where course_id='${course}' and acknowledged_at is null)`));
          const n0 = open();
          await ack.first().click();
          for (let k = 0; k < 20 && open() === n0; k++) await a.waitForTimeout(300);
          reviewed += 1;
        }
        rec.shots.push(await shot(a, "terbit-temuan-ditinjau"));
        notes.push(`the school admin reviewed ${reviewed} finding(s); readiness now: ${siap(course)}`);
      }
    }
    const t = await tekan(page, kunci, tombol);
    const who = siapa === "g" ? "Gladys" : "the school admin";
    if (t.tidakAda) { notes.push(`${kunci}: no "${tombol}" button for ${who}; state ${keadaanBab(course)}; the page says: ${await kataLangkah(page)}`); rec.verdict = "FAIL"; return notes.join("; "); }
    if (!t.after) { notes.push(`${kunci}: pressed by ${who}, nothing moved (${keadaanBab(course)}); the page says: ${await kataLangkah(page)}`); rec.verdict = "FAIL"; return notes.join("; "); }
    notes.push(`${kunci} → ${t.after}`);
  }
  terbitBab = keadaanBab(course).endsWith("|PUBLISHED");
  const tests = sql(`select coalesce(string_agg(mode::text, ',' order by mode::text), '-') from public.assessment_definitions where course_id='${course}'`).trim();
  notes.push(`published: ${terbitBab}; its tests: ${tests}`);
  if (!terbitBab) rec.verdict = "FAIL";
  return notes.join("; ");
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
  return `after Sediakan: ${u.pathname}${u.searchParams.get("kode") ? ` kode=${u.searchParams.get("kode")}` : ""}; learning assignments ${la}; assessment assignments ${aa}; window in Jakarta time ${win} (asked: today .. ${sampai}; starts at the school's midnight: ${dariOk}; ends at 23:59:59 of ${sampai}: ${sampaiOk})`;
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
  const listed = /Matematika Kelas 5|Bilangan Cacah/.test(home);
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
  const resp = await p.goto(`${APP}/masuk/kartu`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(p, "unknown-page"));
  const txt = await bodyText(p);
  const frameworkDefault = /This page could not be found|Application error/i.test(txt);
  if (frameworkDefault) rec.verdict = "FAIL";
  return `HTTP ${resp?.status()} | framework default page: ${frameworkDefault} | text: ${txt.slice(0, 120)}`;
});

await browser.close();
writeFileSync(join(OUT, "journey.json"), JSON.stringify({ ids, steps }, null, 2));
const tally = steps.reduce((m, s) => ((m[s.verdict] = (m[s.verdict] ?? 0) + 1), m), {});
console.log("TALLY", JSON.stringify(tally));

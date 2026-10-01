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
  await page.getByRole("heading", { name: "Periksa email Anda" }).waitFor({ timeout: 15000 });
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

await step("S1", "Gladys signs in with the email link (same browser)", async (rec) => {
  const r = await magicSignIn(g, GLADYS);
  rec.shots.push(await shot(g, "gladys-after-signin"));
  if (!["/konfigurasi", "/"].includes(r.landed)) rec.verdict = "FAIL";
  if (s14Terlihat.length) rec.verdict = "FAIL";
  return `landed on ${r.landed}; email subject "${r.subject}"; S14 shown on the way: ${s14Terlihat.length ? `yes, at ${s14Terlihat.join(", ")}` : "no"}`;
});

await step("S1b", "the same link opened in a different browser", async (rec) => {
  const other = await ctx();
  const p = await other.newPage();
  const t0 = new Date(Date.now() - 1000);
  const asker = await (await ctx()).newPage();
  await asker.goto(`${APP}/masuk`, { waitUntil: "networkidle" });
  await asker.locator("#email").fill(GLADYS);
  await asker.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await asker.getByRole("heading", { name: "Periksa email Anda" }).waitFor({ timeout: 15000 });
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
  // ADM-J08: the school's code is set on the Pendataan screen, by the school admin
  await a.goto(`${APP}/pendataan`, { waitUntil: "networkidle" });
  await tutupTur(a);
  await a.locator("#pin-kode-isi").fill("SDZ");
  await a.getByRole("button", { name: "Simpan kode", exact: true }).click();
  await a.waitForURL((u) => u.pathname === "/pendataan", { timeout: SLOW });
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
  // Since BOB-07 the redirect carries no batch id (codes only), so the new batch is read from the database.
  const newest = () => sql(`select coalesce((select id::text from public.ingest_batches order by created_at desc, id desc limit 1), '')`).trim();
  const sebelum = newest();
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
// the blockers as text whatever their shape: a text[] of sentences before BOB-17, a jsonb list of codes after it
// (the audit also runs against older releases, production's among them)
const siap = (c) => sql(`select status || ' | ' || coalesce(blockers::text, '') from public.publish_readiness('${c}')`).trim();

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
  const f = new URL("./fixtures/sd5-matematika-bab1.paket.json", import.meta.url);
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
async function jawab(page, mode, right, { simpanTerakhir = true } = {}) {
  const formal = mode === "post";
  let ditanya = null;
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
    if (formal && !(terakhir && !simpanTerakhir)) {
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
  return { answered: done.length, right: done.filter((d) => d.right).length, unknown: done.filter((d) => !d.known).length, ditanya };
}

const kartuKelas = [];
// ADM-J08: the Pendataan screen, as a school admin uses it with a list copied from a spreadsheet.
async function catatLewatLayar(page, nama, shots) {
  const jejak = [];
  await page.goto(`${APP}/pendataan`, { waitUntil: "networkidle" });
  await tutupTur(page);
  await page.locator("#pin-tempel").fill(["nama", ...nama].join("\n"));
  await page.locator("#pin-medan-node_id").waitFor({ timeout: SLOW });
  const tempat = await page.locator("#pin-medan-node_id option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() })));
  const k1a = tempat.find((o) => o.v.startsWith("t:") && /Kelas 1A/.test(o.t));
  if (!k1a) throw new Error(`Kelas 1A is not offered as a place: ${JSON.stringify(tempat.map((o) => o.t))}`);
  await page.locator("#pin-medan-node_id").selectOption(k1a.v);
  await page.locator("#pin-medan-role").selectOption("t:STUDENT");
  jejak.push(`pasted ${nama.length} names; Tempat «${k1a.t}», Peran Murid for every row`);
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
    const daftar = await t.locator("main .pin-sec").evaluateAll((els) => els.map((e) => ({
      judul: (e.querySelector("h2")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      nama: e.innerText.replace(/\s+/g, " ").trim(),
    })));
    return { daftar, shotPath };
  } finally {
    await tc.close();
  }
}

await step("S21", "five students take Bab 1's pre-test and post-test to plan; student 4 chooses the last post-test answer, does not press «Simpan jawaban ini», and hands in (W3); each result page says what was answered", async (rec) => {
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
      const post = await jawab(s, "post", plan.post, { simpanTerakhir: !w3 });
      await s.locator("h1").first().waitFor({ timeout: SLOW });
      const t = await bodyText(s);
      const m = t.match(/Terjawab tepat (\d+) dari (\d+) soal/);
      const ok = m && Number(m[1]) === plan.post && Number(m[2]) === SOAL.post && !pre.unknown && !post.unknown;
      if (!ok) rec.verdict = "FAIL";
      if (i === 0 || w3) rec.shots.push(await shot(s, `d064-murid${i + 1}-hasil`));
      out.push(`${k.nama}: pre ${pre.right}/${pre.answered}, post ${post.right}/${post.answered}${w3 ? " (the last answer chosen, not saved)" : ""}; «Kumpulkan» ${post.ditanya ? "asked first" : "handed in at once"}; the page says "${m?.[0] ?? "no 'Terjawab tepat' line"}"${ok ? "" : w3 ? " MISMATCH: the unsaved answer was lost at «Kumpulkan» (W3)" : " MISMATCH"}`);
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

await step("S22", "the teacher reaches Lihat bukti by clicking and reads the class figures from official evidence, then opens a student's record from the roster (EDU-12, X-10, EDU-J03, M4)", async (rec) => {
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
  return `${jalan}; ${catatan}; expected comprehension ${pahamTeks} and net gain ${naikTeks} (from the plan); on the page: comprehension ${simpulan.includes(pahamTeks)}, ` +
    `net gain ${simpulan.includes(naikTeks)}, mastery by part shown ${bagian}; figures still absent: ${absen} (misconceptions need registered codes, D-063); ` +
    `Mengumpulkan ${JSON.stringify(kumpul)}; the figures section says: "${simpulan.slice(0, 700)}"`;
});

await step("S23", "the head of department reads Kelas 1A's figures beside the class's size on /pimpinan, opens and prints the class's report and comes back, and reads their department's roster (HOD-09, X-10, HOD-J05, HOD-J06, HOD-J09)", async (rec) => {
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
    await h.getByRole("link", { name: "← Kembali", exact: true }).click();
    await h.waitForURL((u) => u.pathname === "/pimpinan", { timeout: SLOW });
    await h.locator('section[aria-labelledby="pin-bukti"]').first().waitFor({ timeout: SLOW }).catch(() => {});
    laporan = `report: print offered ${adaCetak}, prints the report without its controls ${tercetak}, «Kembali» back on /pimpinan true`;
    if (!tercetak) rec.verdict = "FAIL";
  } catch (e) {
    rec.verdict = "FAIL";
    laporan = `report: stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  // W10: above the class. What «Yang didukung bukti» says to a head of department over a department, and
  // the department's roster, reached by clicking (Lihat lebih rinci → Murid pada bagian ini)
  const bagianC = norm(await h.locator('section[aria-labelledby="pin-bukti"]').innerText().catch(() => ""));
  const kosongC = /Belum ada angka yang bisa ditampilkan/.test(bagianC);
  let roster = "";
  let bawahDept = "";
  try {
    await h.getByRole("link", { name: "Lihat lebih rinci" }).first().click();
    await h.waitForURL((u) => /^\/pimpinan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
    // W11: the parts offered below the department are Tingkat and Kelas, never the hidden «Reguler» or «Jenjang»
    bawahDept = norm(await h.locator('section[aria-labelledby="pin-bawah"]').innerText().catch(() => ""));
    await h.getByRole("link", { name: "Murid pada bagian ini" }).first().click();
    await h.waitForURL((u) => u.pathname.endsWith("/murid"), { timeout: SLOW });
    await h.locator("h1").first().waitFor({ timeout: SLOW });
    roster = await bodyText(h);
    rec.shots.push(await shot(h, "d064-kaprodi-murid"));
  } catch (e) {
    roster = `not reached: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`;
  }
  const tercantum = MURID.filter((n) => roster.includes(n)).length;
  const tersembunyi = /\b(Reguler|Jenjang)\b/.test(bawahDept);
  if (kosongC || tercantum < MURID.length || tersembunyi || !bawahDept.includes("Kelas 1A")) rec.verdict = "FAIL";
  await hc.close();
  return `«Yang didukung bukti» says: "${bagianC.slice(0, 160)}"${kosongC ? " (NO FIGURES, while Kelas 1A has them: W10)" : ""}; the department's roster lists ${tercantum} of ${MURID.length} students; below the department: "${bawahDept.slice(0, 160)}"${tersembunyi ? " (HIDDEN LEVEL SHOWN: W11)" : ""}; ` +
    `${laporan} (HOD-J09); Kelas 1A: "${tanda}", size shown ${ukuran?.[1] ?? "no"} (expected ${MURID.length}: HOD-J05); expected comprehension ${pahamTeks} and net gain ${naikTeks}, as on «Lihat bukti»; comprehension shown ${isi.includes(pahamTeks)}, ` +
    `net gain shown ${isi.includes(naikTeks)}; the class's figures say: "${isi.slice(0, 500)}"`;
});

// ADM-J14: the school admin ends a role on Peran & akses (the revoke button, never clicked before), and the
// head of department, signing in afresh, is refused Pimpinan. Last, because it takes S23's reader away.
await step("S24", "the school admin revokes the head of department's role on Konfigurasi → Peran & akses; the head of department is then refused /pimpinan (ADM-J14)", async (rec) => {
  await a.goto(`${APP}/konfigurasi#roles`, { waitUntil: "networkidle" });
  const baris = a.locator("#roles li").filter({ hasText: "Kepala departemen" }).filter({ hasText: "Kelas Rendah" }).first();
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    rec.shots.push(await shot(a, "adm-j14-peran"));
    return `no «Kepala departemen · Kelas Rendah» row on Peran & akses: ${norm(await a.locator("#roles").innerText().catch(() => "")).slice(0, 300)}`;
  }
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
if (red.length) {
  console.log(`RED: ${red.map((s) => `${s.id} ${s.verdict}`).join(", ")}`);
  process.exitCode = 1;
}

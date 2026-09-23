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
import { mkdirSync, writeFileSync } from "node:fs";
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
  return execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
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
  await page.goto(`${APP}/konfigurasi#roles`, { waitUntil: "networkidle" });
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
  await page.waitForLoadState("networkidle");
  const u = new URL(page.url());
  return { ok: u.searchParams.get("ok"), detail: u.searchParams.get("detail"), url: u.pathname + u.search, scopesOffered: scopes.length };
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
  if (r.ok !== "1" && r.ok !== "true") rec.verdict = "FAIL";
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

await step("S7", "is there any screen to create a class (org tree)?", async (rec) => {
  const pages = ["/konfigurasi", "/pendataan", "/studio"];
  const found = [];
  for (const p of pages) {
    await a.goto(`${APP}${p}`, { waitUntil: "networkidle" });
    const t = await bodyText(a);
    if (/(buat|tambah)\s+(kelas|rombel|unit|jurusan|departemen)/i.test(t)) found.push(p);
  }
  rec.shots.push(await shot(a, "pendataan-admin"));
  if (!found.length) rec.verdict = "BLOCKED";
  return found.length ? `class creation offered on ${found.join(", ")}` : "no screen offers to create a class, department or cohort";
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
  const failed = sql(`select count(*) from public.import_rows r where r.job_id='${job.data}' and r.status::text not in ('DONE','PROVISIONED','SUCCEEDED')`);
  if (Number(failed) > 0) rec.verdict = "FAIL";
  ids.rootJob = job.data;
  return `${log.join(" | ")} | rows not recorded: ${failed}; row states: ${sql(`select string_agg(ordinal||':'||status::text, ',') from public.import_rows where job_id='${job.data}'`)}`;
});

await step("W1", "OPERATOR: build SD's tree down to a class (no screen exists for this)", async () => {
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
  const states = sql(`select string_agg(ordinal||':'||status::text, ',') from public.import_rows where job_id='${job.data}'`);
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
  if (r.ok !== "1" && r.ok !== "true") rec.verdict = "FAIL";
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

await step("S14", "Gladys uploads a lesson: Unggah Mudah", async (rec) => {
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  rec.shots.push(await shot(g, "studio-unggah"));
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
  await g.waitForLoadState("networkidle");
  rec.shots.push(await shot(g, "studio-unggah-mudah-result"));
  const u = new URL(g.url());
  const confirmBtn = g.getByRole("button", { name: "Konfirmasi" }).first();
  let confirm = "no Konfirmasi button offered";
  if (await confirmBtn.count()) {
    await confirmBtn.click();
    await g.waitForLoadState("networkidle");
    rec.shots.push(await shot(g, "studio-unggah-mudah-confirm"));
    const u2 = new URL(g.url());
    confirm = `confirm → ok=${u2.searchParams.get("ok")} detail=${u2.searchParams.get("detail")}`;
  }
  const courses = sql(`select count(*) from public.courses where institution_id='${ids.sd}'`);
  if (Number(courses) === 0) rec.verdict = "FAIL";
  return `file inputs on page: ${fileInputs}; school preselected: "${firstSchool?.trim()}"; submit → ok=${u.searchParams.get("ok")} detail=${u.searchParams.get("detail")}; ${confirm}; courses at SD: ${courses}`;
});

await step("S15", "Gladys uploads a lesson: Paket Terstruktur", async (rec) => {
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  const form = g.locator("form").filter({ has: g.locator('textarea[name="isi"]') }).nth(1);
  const sel = form.locator("select").first();
  if (await sel.count()) {
    const v = await sel.locator("option").filter({ hasText: "SD Zayd" }).first().getAttribute("value");
    if (v) await sel.selectOption(v);
  }
  await form.locator('textarea[name="isi"]').fill(JSON.stringify({ courses: [{ subject: "Matematika", stage: "SD", grade_label: "Kelas 1", title: "Penjumlahan sampai 20" }] }));
  await form.locator('button[type="submit"]').first().click();
  await g.waitForLoadState("networkidle");
  rec.shots.push(await shot(g, "studio-terstruktur-result"));
  const u = new URL(g.url());
  const courses = sql(`select count(*) from public.courses where institution_id='${ids.sd}'`);
  const lessons = sql(`select count(*) from public.lessons l join public.modules m on m.id=l.module_id join public.courses c on c.id=m.course_id where c.institution_id='${ids.sd}'`);
  if (Number(lessons) === 0) rec.verdict = "FAIL";
  return `submit → ok=${u.searchParams.get("ok")} detail=${u.searchParams.get("detail")}; courses at SD: ${courses}; lessons at SD: ${lessons}`;
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

await browser.close();
writeFileSync(join(OUT, "journey.json"), JSON.stringify({ ids, steps }, null, 2));
const tally = steps.reduce((m, s) => ((m[s.verdict] = (m[s.verdict] ?? 0) + 1), m), {});
console.log("TALLY", JSON.stringify(tally));

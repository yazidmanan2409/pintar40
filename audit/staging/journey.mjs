// The 5 Oct learning journey on STAGING, through PINTAR's own screens (D-050; Yazid, 28 Sep).
//
// In the synthetic school only ("Sekolah Uji Kinerja (sintetis)", D-046(c)), as its synthetic school admin and
// synthetic teacher, with synthetic students the admin records and activates on the way (approved 28 Sep):
//   J01 the admin gives the school its code          J09 student 1 pages through every lesson
//   J02 the admin records five students (intake)     J10 the post-test is reachable by clicking
//   J03 the admin makes each a class card            J11 student 1 takes the post-test
//   J04 the teacher uploads SD 5 Bab 1 (workbook)    J12 student 1 reads the result
//   J05 teacher and admin take it to published       J13 students 2-5 take both tests
//   J06 the teacher assigns it to the class          J14 the teacher reads the class evidence
//   J07 student 1 signs in with the card             Q1-Q2 Bank Soal as teacher and as admin
//   J08 student 1 opens it and takes the pre-test    Q3-Q5 Uji Cepat from the bank, taken and seen
// Media are uploaded because the workbook names them and Studio will not save it without them; playing them is
// out of scope (D-050). Each student answers to a plan (how many right), so the result pages are checked against
// numbers known in advance, not merely seen.
//
// What is NOT the product's own path, said once: staff sign in with a session the server makes (lib.mjs), because
// the synthetic addresses receive no mail; everything after that is clicks. Staging's database is only READ, in
// read-only transactions, to confirm what the screens claim. Nothing is written except by pressing PINTAR's buttons.
// Card numbers and PINs are masked in the log and blanked out of screenshots.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour, signIn } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const ADMIN_EMAIL = env("ADMIN_EMAIL");
const GURU_EMAIL = env("GURU_EMAIL");
const WORKBOOK = env("WORKBOOK");
const KEY_JSON = env("KEY_JSON");
const MEDIA_DIR = env("MEDIA_DIR");
const OUT = process.env.OUT_DIR ?? "out";
const TAG = `J${process.env.RUN_TAG ?? "0"}`;
const SCHOOL = "Sekolah Uji Kinerja (sintetis)";
const KELAS = "Kelas Uji Kinerja A";
const CODES = ["UJK", "UJ1", "UJ2"];
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
mkdirSync(join(OUT, "shots"), { recursive: true });

// ---------------------------------------------------------------- reading staging, never writing it
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };

const school = sql(`select id || '|' || is_synthetic from public.institutions where name = ${lit(SCHOOL)}`);
const [SID, synth] = school.split("|");
if (synth !== "true") throw new Error("the journey runs only in the synthetic school");
const KID = sql(`select id from public.org_nodes where institution_id = ${uuid(SID)} and kind = 'CLASS' and name = ${lit(KELAS)} and is_active`);

// ---------------------------------------------------------------- the answer key (the workbook's own Benar column,
// as its JSON twin carries it; the two were checked identical, 28 Sep)
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const KEY = new Map();
for (const c of JSON.parse(readFileSync(KEY_JSON, "utf8")).courses)
  for (const m of c.modules) for (const l of m.lessons) for (const it of l.items ?? [])
    KEY.set(norm(it.stem), { right: new Set(it.options.filter((o) => o.is_correct).map((o) => norm(o.body))),
                             wrong: new Set(it.options.filter((o) => !o.is_correct).map((o) => norm(o.body))) });
const MEDIA = JSON.parse(readFileSync(KEY_JSON, "utf8")).courses.flatMap((c) => c.modules.flatMap((m) =>
  m.lessons.flatMap((l) => (l.media ?? []).map((x) => x.file))));

// How many each student answers right: pre-test of 4, post-test of 8 (the workbook's marked questions)
const PLAN = [{ pre: 2, post: 7 }, { pre: 1, post: 6 }, { pre: 0, post: 5 }, { pre: 3, post: 8 }, { pre: 2, post: 4 }];
const names = PLAN.map((_, i) => `Siswa Uji ${TAG}-${i + 1} (sintetis)`);

// ---------------------------------------------------------------- steps, evidence, secrets
const steps = [];
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const secret = (v) => { for (const x of new Set([v, v.replace(/\D/g, ""), v.replace(/\s/g, "")])) if (x) console.log(`::add-mask::${x}`); };
let shotN = 0;
async function shot(page, name) {
  const f = `${String(++shotN).padStart(3, "0")}-${name}.png`;
  await page.evaluate(() => document.querySelectorAll(".pin-akt-hasil strong.pin-num").forEach((e) => { e.textContent = "••••"; })).catch(() => {});
  await page.screenshot({ path: join(OUT, "shots", f), fullPage: true }).catch(() => {});
  return f;
}
async function step(id, title, rows, fn) {
  const rec = { id, title, rows, verdict: "PASS", kind: "", note: "", shots: [], page: null };
  const t0 = Date.now();
  try { rec.note = (await fn(rec)) ?? rec.note; }
  catch (e) {
    rec.verdict = "FAIL"; rec.kind ||= "unclassified";
    rec.note = `${rec.note ? `${rec.note} | ` : ""}stopped: ${String(e.message || e).split("\n")[0].slice(0, 300)}`;
    if (rec.page) rec.shots.push(await shot(rec.page, `${id}-stopped`));
  }
  rec.ms = Date.now() - t0;
  delete rec.page;
  steps.push(rec);
  log(`${rec.verdict.padEnd(7)} ${id} ${title}${rec.kind ? ` [${rec.kind}]` : ""} — ${rec.note}`);
  return rec;
}
const blocked = (rec, why) => { rec.verdict = "BLOCKED"; return why; };
const text = async (page, sel = "main") => norm(await page.locator(sel).first().innerText().catch(() => ""));
const until = async (f, ms = SLOW, every = 500) => { for (const end = Date.now() + ms; Date.now() < end; await new Promise((r) => setTimeout(r, every))) { const v = f(); if (v) return v; } return f(); };

// ---------------------------------------------------------------- browsers
const browser = await chromium.launch();
const seen = { server5xx: [], pageErrors: [] };
async function newPage(who, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => seen.pageErrors.push({ who, url: page.url(), error: String(e.message || e).slice(0, 200) }));
  page.on("response", (r) => { if (r.status() >= 500 && r.url().startsWith(APP)) seen.server5xx.push({ who, status: r.status(), path: new URL(r.url()).pathname }); });
  return page;
}
// open a screen and wait until its heading is there; a first visit's tour is closed as "Lewati"
async function lihat(page, path) {
  // a form's own redirect (?hasil=…) can still be arriving; opening a page over it is retried, not failed
  for (let i = 0; ; i++) {
    try { await page.goto(`${APP}${path}`, { timeout: SLOW }); break; }
    catch (e) { if (i >= 3 || !/interrupted by another navigation/.test(String(e.message))) throw e; await page.waitForLoadState("load").catch(() => {}); }
  }
  const want = path.split("?")[0].split("#")[0];
  await page.waitForURL((u) => u.pathname === want, { timeout: SLOW, waitUntil: "commit" });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
  await closeTour(page);
}
const A = await newPage("admin");
const G = await newPage("guru");

// ---------------------------------------------------------------- the journey
await step("J00", "the synthetic admin and teacher sign in (server-made session; see the header)", ["ADM-01", "EDU-01"], async (rec) => {
  rec.page = A;
  const a = await signIn(A, ADMIN_EMAIL, "/konfigurasi"); await closeTour(A);
  rec.page = G;
  const g = await signIn(G, GURU_EMAIL, "/mengajar"); await closeTour(G);
  return `admin: ${a}; teacher: ${g}`;
});

let code = sql(`select coalesce(namespace, '') from public.institutions where id = ${uuid(SID)}`);
await step("J01", "the admin gives the school its code on Pendataan (a school without one cannot record anybody)", ["ADM-07", "X-01"], async (rec) => {
  rec.page = A;
  await lihat(A, "/pendataan");
  rec.shots.push(await shot(A, "pendataan-before"));
  if (code) { rec.verdict = "NOTE"; return `the school already has code ${code}; nothing to do`; }
  const tried = [];
  for (const c of CODES) {
    await A.locator("#pin-kode-isi").fill(c);
    await A.getByRole("button", { name: "Simpan kode", exact: true }).click();
    await A.waitForLoadState("load");
    code = await until(() => sql(`select coalesce(namespace, '') from public.institutions where id = ${uuid(SID)}`), 15000);
    tried.push(c);
    if (code) break;
  }
  rec.shots.push(await shot(A, "pendataan-kode"));
  if (!code) { rec.verdict = "FAIL"; return `no code was saved after trying ${tried.join(", ")}; the page says: ${(await text(A)).slice(0, 200)}`; }
  await lihat(A, "/pendataan");
  const example = (await text(A)).match(/Contoh nomor induk\W*\w+/)?.[0] ?? "no example shown";
  return `code ${code} saved (tried ${tried.join(", ")}); reopened, the page shows: "${example}"`;
});

let job = null;
await step("J02", `the admin records ${names.length} synthetic students in ${KELAS} by pasting a list (Pendataan)`, ["ADM-07", "X-01"], async (rec) => {
  rec.page = A;
  if (!code) return blocked(rec, "the school has no code");
  await lihat(A, "/pendataan");
  await A.locator("#pin-tempel").fill(`Nama\n${names.join("\n")}`);
  await A.locator("#pin-medan-display_name").waitFor({ state: "visible", timeout: SLOW });
  const pick = async (field, want) => {
    const sel = A.locator(`#pin-medan-${field}`);
    const v = await sel.evaluate((s, w) => [...s.options].find((o) => o.value.startsWith("t:") && o.textContent.includes(w))?.value ?? null, want);
    if (v) await sel.selectOption(v);
    return v ? (await sel.locator("option:checked").textContent()).trim() : null;
  };
  const guessedName = await A.locator("#pin-medan-display_name").inputValue();
  const place = await pick("node_id", KELAS);
  const role = await pick("role", "Murid");
  const programme = await pick("programme_id", KELAS);
  rec.shots.push(await shot(A, "pendataan-peta"));
  const notes = [`name column guessed: ${guessedName === "k:0"}`, `place: ${place}`, `role: ${role}`, `programme: ${programme ?? "(not offered)"}`];
  if (!place || !role) { rec.verdict = "FAIL"; return notes.join("; "); }
  await A.getByRole("button", { name: "Lanjut ke pemeriksaan", exact: true }).click();
  await A.waitForURL((u) => /^\/pendataan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
  job = decodeURIComponent(new URL(A.url()).pathname.split("/").pop());
  await A.getByRole("button", { name: "Periksa daftar ini", exact: true }).click();
  const bersih = A.getByText("Semua baris bisa dicatat.");
  const kotor = A.getByText("baris perlu diperbaiki.");
  await Promise.race([bersih.waitFor({ timeout: SLOW }), kotor.waitFor({ timeout: SLOW })]);
  rec.shots.push(await shot(A, "pendataan-periksa"));
  if (!(await bersih.isVisible())) { rec.verdict = "FAIL"; notes.push(`the check refused rows: ${(await text(A)).slice(0, 400)}`); return notes.join("; "); }
  await A.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).click();
  const done = A.getByText("orang tercatat di sekolah ini.");
  for (let i = 0; i < 20 && !(await done.isVisible()); i++) {
    for (const label of ["Sudah saya periksa, lanjutkan sisanya", "Mulai mencatat", "Lanjutkan"]) {
      const b = A.locator("main").getByRole("button", { name: label, exact: true });
      if (await b.isVisible().catch(() => false) && await b.isEnabled().catch(() => false)) { notes.push(`pressed "${label}"`); await b.click(); break; }
    }
    await done.waitFor({ timeout: 3000 }).catch(() => {});
  }
  rec.shots.push(await shot(A, "pendataan-selesai"));
  const states = sql(`select string_agg(state::text, ',' order by ordinal) from public.import_rows where job_id = ${uuid(job)}`);
  const recorded = sql(`select count(distinct p.id) from public.persons p join public.enrollments e on e.person_id = p.id
                         where e.institution_id = ${uuid(SID)} and p.display_name in (${names.map(lit).join(",")})`);
  notes.push(`row states: ${states}; enrolled at the school: ${recorded}/${names.length}; "Selesai" shown: ${await done.isVisible()}`);
  if (Number(recorded) !== names.length) rec.verdict = "FAIL";
  return notes.join("; ");
});

const cards = [];
await step("J03", "the admin makes a class card for each student (Aktivasi → Buat kartu kelas)", ["ADM-07", "STU-01"], async (rec) => {
  rec.page = A;
  await lihat(A, "/aktivasi");
  const notes = [];
  for (const n of names) {
    const li = A.locator("li.pin-akt-orang").filter({ hasText: n }).first();
    if (!(await li.count())) { notes.push(`${n}: not listed as waiting for an account`); cards.push(null); continue; }
    await li.getByRole("button", { name: "Buat kartu kelas", exact: true }).click();
    const nums = li.locator(".pin-akt-hasil strong.pin-num");
    await nums.nth(1).waitFor({ state: "visible", timeout: SLOW });
    const number = norm(await nums.nth(0).innerText()), pin = norm(await nums.nth(1).innerText());
    secret(number); secret(pin);
    cards.push({ number, pin });
  }
  rec.shots.push(await shot(A, "aktivasi-kartu"));
  const made = cards.filter(Boolean).length;
  notes.push(`${made}/${names.length} cards made (numbers and PINs masked)`);
  if (made !== names.length) rec.verdict = "FAIL";
  return notes.join("; ");
});

let course = null;
await step("J04", "the teacher uploads SD 5 Matematika Bab 1 (workbook) in Studio: check, media, save", ["ADM-09", "X-02"], async (rec) => {
  rec.page = G;
  await lihat(G, "/studio/unggah");
  const sel = G.locator("#ung-sekolah");
  await sel.waitFor({ state: "visible", timeout: SLOW });
  const offered = (await sel.locator("option").allTextContents()).map(norm);
  const pre = norm(await sel.locator("option:checked").textContent());
  const v = await sel.locator("option").filter({ hasText: SCHOOL }).first().getAttribute("value");
  await sel.selectOption(v);
  const notes = [`schools offered: ${JSON.stringify(offered)}; preselected: ${pre}`];
  await G.locator("#ung-berkas").setInputFiles(WORKBOOK);
  await G.getByRole("button", { name: "Periksa buku kerja", exact: true }).click();
  const lolos = G.getByText("Buku kerja lolos pemeriksaan.");
  const gagal = G.getByText(/Belum ada yang disimpan/);
  await Promise.race([lolos.waitFor({ timeout: 90000 }), gagal.waitFor({ timeout: 90000 })]);
  rec.shots.push(await shot(G, "unggah-periksa"));
  if (!(await lolos.isVisible())) { rec.verdict = "FAIL"; notes.push(`the check refused the workbook: ${(await text(G)).slice(0, 400)}`); return notes.join("; "); }
  notes.push(`checked: ${(await text(G, ".pin-ung-lolos, main")).match(/Kursus[^.]*?Media\s*\d+/)?.[0] ?? "passed"}`);
  const mediaInput = G.locator("#ung-media");
  if (await mediaInput.count()) {
    const files = MEDIA.map((f) => join(MEDIA_DIR, f)).filter((f) => existsSync(f));
    await mediaInput.setInputFiles(files);
    await G.getByRole("button", { name: "Unggah media", exact: true }).click();
    const all = new RegExp(`${files.length}\\s*/\\s*${files.length}`);
    const ok = await G.getByText(all).first().waitFor({ timeout: 300000 }).then(() => true, () => false);
    notes.push(`media named by the workbook: ${MEDIA.length}; uploaded: ${ok ? `${files.length}/${files.length}` : "not all"} (setup: Studio will not save without them; playback not tested, D-050)`);
    rec.shots.push(await shot(G, "unggah-media"));
    if (!ok) { rec.verdict = "FAIL"; return notes.join("; "); }
  }
  await G.getByRole("button", { name: "Simpan ke Studio", exact: true }).click();
  await G.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: 90000 });
  rec.shots.push(await shot(G, "unggah-simpan"));
  const href = await G.getByRole("link", { name: "Buka kursus" }).getAttribute("href");
  course = href.split("/").pop();
  const counts = sql(`select (select count(*) from public.modules where course_id = ${uuid(course)}) || ' modules, ' ||
      (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = ${uuid(course)}) || ' lessons, ' ||
      (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = ${uuid(course)}) || ' questions; tests: ' ||
      coalesce((select string_agg(mode::text || ' ' || item_count, ', ' order by mode::text) from public.assessment_definitions where course_id = ${uuid(course)}), 'none')`);
  notes.push(`saved as a draft; course ${course.slice(0, 8)}: ${counts}`);
  if (!/6 lessons, 28 questions/.test(counts) || !/POST_TEST 8/.test(counts) || !/PRE_TEST 4/.test(counts)) rec.verdict = "FAIL";
  return notes.join("; ");
});

const keadaan = () => sql(`select c.status || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id = ${uuid(course)}`);
const unack = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id = ${uuid(course)} and acknowledged_at is null and severity::text = 'WARNING')
  + (select count(*) from public.coaching_findings where course_id = ${uuid(course)} and acknowledged_at is null and severity::text = 'WARNING')`));
const errors = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id = ${uuid(course)} and acknowledged_at is null and severity::text = 'ERROR')
  + (select count(*) from public.coaching_findings where course_id = ${uuid(course)} and acknowledged_at is null and severity::text = 'ERROR')`));
const readiness = () => sql(`select status || ' ' || coalesce(blockers::text, '') from public.publish_readiness(${uuid(course)})`);
async function tekan(page, label, name) {
  await lihat(page, `/studio/paket/${course}`);
  const b = page.getByRole("button", { name: label, exact: true });
  if (!(await b.count())) return { absent: true };
  const before = keadaan();
  await b.first().click();
  const after = await until(() => { const k = keadaan(); return k !== before ? k : null; }, 20000);
  const f = await shot(page, `terbit-${name}${after ? "" : "-nothing-moved"}`);
  return { after, before, f };
}
async function tinjauSemua(page) {
  let n = 0;
  for (let i = 0; i < 80 && unack() > 0; i++) {
    await lihat(page, `/studio/paket/${course}`);
    const b = page.getByRole("button", { name: "Sudah saya tinjau", exact: true });
    if (!(await b.count())) break;
    const n0 = unack();
    await b.first().click();
    await page.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
    await until(() => unack() < n0, 10000, 300);
    n++;
  }
  return n;
}
let release = null;
await step("J05", "Studio to published with two people: the teacher prepares and submits; the admin reviews findings, approves, locks, publishes", ["ADM-11", "ADM-12", "X-03", "X-04"], async (rec) => {
  if (!course) return blocked(rec, "J04 saved no course");
  const notes = [`start ${keadaan()}`];
  for (const [label, name] of [["Tandai sudah tersusun", "susun"], ["Tandai lolos pemeriksaan", "periksa"], ["Ajukan untuk ditinjau", "ajukan"]]) {
    rec.page = G;
    const t = await tekan(G, label, name);
    rec.shots.push(t.f ?? "");
    if (t.absent || !t.after) { rec.verdict = "FAIL"; notes.push(`${name}: ${t.absent ? `the teacher is not offered "${label}"` : "nothing moved"}; the page: ${(await text(G)).slice(0, 300)}`); return notes.join("; "); }
    notes.push(`teacher ${name} → ${t.after}`);
  }
  await lihat(G, `/studio/paket/${course}`);
  const offered = [];
  for (const l of ["Setujui isi", "Kunci terbitan", "Terbitkan"]) if (await G.getByRole("button", { name: l, exact: true }).count()) offered.push(l);
  notes.push(`the teacher (author, no CAN_PUBLISH) is offered: ${offered.length ? offered.join(", ") : "none of Setujui isi / Kunci terbitan / Terbitkan"}`);
  if (offered.length) { rec.verdict = "FAIL"; rec.kind = "product"; }
  rec.page = A;
  const e0 = errors();
  notes.push(`findings waiting when the reviewer arrives (before Setujui isi): ${unack()} warnings, ${e0} errors`);
  if (e0 > 0) { rec.verdict = "FAIL"; notes.push(`ERROR findings block publishing: ${readiness()}`); return notes.join("; "); }
  notes.push(`the admin reviewed ${await tinjauSemua(A)} warning(s) before approving`);
  rec.shots.push(await shot(A, "terbit-temuan-ditinjau"));
  for (const [label, name] of [["Setujui isi", "setujui"], ["Buat terbitan", "buat"], ["Kunci terbitan", "kunci"]]) {
    const t = await tekan(A, label, name);
    rec.shots.push(t.f ?? "");
    if (t.absent || !t.after) { rec.verdict = "FAIL"; notes.push(`${name}: ${t.absent ? `the admin is not offered "${label}"` : "nothing moved"}; the page: ${(await text(A)).slice(0, 300)}`); return notes.join("; "); }
    notes.push(`admin ${name} → ${t.after}`);
  }
  const back = unack();
  notes.push(`after Kunci terbitan: ${back} warning(s) waiting again; readiness ${readiness()}`);
  if (back > 0) {
    rec.findings = [`Kunci terbitan re-runs the question check and the ${back} warning(s) the admin had already reviewed come back unreviewed; Terbitkan waits until they are reviewed a second time`];
    notes.push(`the admin reviewed ${await tinjauSemua(A)} warning(s) again`);
  }
  const t = await tekan(A, "Terbitkan", "terbitkan");
  rec.shots.push(t.f ?? "");
  if (t.absent || !t.after) { rec.verdict = "FAIL"; notes.push(`terbitkan: ${t.absent ? "not offered" : "nothing moved"}; readiness ${readiness()}; the page: ${(await text(A)).slice(0, 300)}`); return notes.join("; "); }
  notes.push(`admin terbitkan → ${t.after}`);
  release = sql(`select id from public.plp_releases where course_id = ${uuid(course)} and status = 'PUBLISHED' order by created_at desc limit 1`);
  if (!release) rec.verdict = "FAIL";
  return notes.join("; ");
});

let tugas = null;
await step("J06", `the teacher assigns the published lesson to ${KELAS} (Mengajar → Siapkan → Sediakan)`, ["EDU-05", "EDU-06", "ADM-13", "ADM-14", "X-05"], async (rec) => {
  rec.page = G;
  if (!release) return blocked(rec, "J05 published nothing");
  await lihat(G, "/mengajar");
  const k = G.locator('a[href^="/mengajar/"]').filter({ hasText: KELAS }).first();
  await k.click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${KID}`, { timeout: SLOW });
  await closeTour(G);
  await G.locator(`a[href="/mengajar/${KID}/siapkan"]`).first().click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${KID}/siapkan`, { timeout: SLOW });
  await closeTour(G);
  const row = G.locator(`a[href="/mengajar/${KID}/siapkan?terbitan=${release}"]`);
  if (!(await row.count())) { rec.verdict = "FAIL"; return `Siapkan does not offer the release; the page: ${(await text(G)).slice(0, 300)}`; }
  await row.first().click();
  await G.waitForURL((u) => u.searchParams.get("terbitan") === release, { timeout: SLOW });
  await G.locator("#pin-sampai").waitFor({ state: "visible", timeout: SLOW });
  const terima = (await text(G)).match(/Yang akan diterima murid.{0,400}/)?.[0] ?? "";
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 30 * 86400000));
  await G.locator("#pin-sampai").fill(sampai);
  rec.shots.push(await shot(G, "siapkan-tinjau"));
  await G.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  tugas = await until(() => sql(`select id from public.learning_assignments where plp_release_id = ${uuid(release)} and node_id = ${uuid(KID)} order by created_at desc limit 1`), SLOW);
  await G.waitForLoadState("load");
  rec.shots.push(await shot(G, "siapkan-hasil"));
  if (!tugas) { rec.verdict = "FAIL"; return `nothing was assigned; the page: ${(await text(G)).slice(0, 300)}`; }
  const aa = sql(`select string_agg(d.mode::text || ' ' || d.item_count || ' soal ' || aa.status::text, ', ' order by d.mode::text)
    from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id where aa.learning_assignment_id = ${uuid(tugas)}`);
  if (!/POST_TEST 8/.test(aa) || !/PRE_TEST 4/.test(aa)) rec.verdict = "FAIL";
  return `before committing, the page said: "${terima.slice(0, 260)}"; assigned until ${sampai}; tests: ${aa}; after Sediakan: ${new URL(G.url()).pathname}${new URL(G.url()).search}`;
});

// ---------------------------------------------------------------- the students
async function masukKartu(page, card) {
  await page.goto(`${APP}/masuk`, { timeout: SLOW });
  await page.getByRole("button", { name: "Gunakan kartu kelas", exact: true }).click();
  await page.locator("#kartu").fill(card.number);
  await page.locator("#pin").fill(card.pin);
  await page.getByRole("button", { name: "Masuk dengan kartu", exact: true }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
  return new URL(page.url()).pathname;
}
const optText = (b) => b.locator("span").nth(1).innerText().then(norm);
// Answer every question, `right` of them correctly (the first `right` shown), and finish. Returns what happened.
async function jawab(page, mode, right) {
  const formal = mode === "post";
  const done = [];
  for (let i = 0; i < 40; i++) {
    const stemEl = page.locator("h2.pin-stem").first();
    await stemEl.waitFor({ state: "visible", timeout: SLOW });
    const raw = await stemEl.innerText();
    const k = KEY.get(norm(raw));
    const opts = page.locator("ul.pin-opsi button.pin-op");
    const texts = [];
    for (let j = 0; j < await opts.count(); j++) texts.push(await optText(opts.nth(j)));
    const wantRight = done.filter((d) => d.right).length < right;
    let idx = k ? texts.findIndex((t) => (wantRight ? k.right : k.wrong).has(t)) : -1;
    if (idx < 0) idx = 0;
    await opts.nth(idx).click();
    await page.waitForFunction(([n]) => document.querySelectorAll("ul.pin-opsi button.pin-op")[n]?.getAttribute("aria-pressed") === "true", [idx], { timeout: SLOW });
    if (formal) {
      await page.getByRole("button", { name: "Kunci jawaban ini", exact: true }).click();
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
    } else {
      await page.waitForTimeout(400);
    }
    done.push({ known: Boolean(k), right: Boolean(k) && wantRight && k.right.has(texts[idx]) });
    const next = page.getByRole("button", { name: "Berikutnya", exact: true });
    if (await next.count()) {
      await next.click();
      await page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, raw, { timeout: SLOW });
      continue;
    }
    const fin = page.getByRole("button", { name: formal ? "Kumpulkan" : "Selesaikan pemetaan", exact: true });
    await fin.click();
    await page.waitForURL((u) => u.pathname.endsWith(formal ? "/hasil" : "/peta") || u.pathname === "/belajar", { timeout: 60000 });
    break;
  }
  return { answered: done.length, right: done.filter((d) => d.right).length, unknown: done.filter((d) => !d.known).length };
}
const person = (n) => sql(`select id from public.persons where display_name = ${lit(n)} order by created_at desc limit 1`);
const sesi = (p, mode) => sql(`select s.status::text || ' ' || coalesce(round(r.mastery * 100)::text || '%', '-') from public.assessment_sessions s
  left join public.assessment_results r on r.session_id = s.id
  where s.person_id = ${uuid(p)} and s.learning_assignment_id = ${uuid(tugas)} and s.mode::text = ${lit(mode)} order by s.created_at desc limit 1`);

const S = await newPage("siswa1", { width: 820, height: 1180 });
await step("J07", "student 1 signs in with the class card on /masuk and lands on /belajar with the lesson waiting", ["STU-01", "STU-02", "STU-03"], async (rec) => {
  rec.page = S;
  if (!cards[0] || !tugas) return blocked(rec, !cards[0] ? "no card" : "nothing assigned");
  const landed = await masukKartu(S, cards[0]);
  const tour = await closeTour(S);
  rec.shots.push(await shot(S, "siswa1-belajar"));
  const h1 = norm(await S.locator("h1").first().innerText());
  const panel = await text(S, "section.pin-lanjut");
  const link = await S.locator(`section.pin-lanjut a[href^="/belajar/${tugas}"]`).count();
  if (landed !== "/belajar" || !link) rec.verdict = "FAIL";
  return `landed on ${landed}; tour shown and skipped: ${tour}; h1 "${h1}"; next-action panel: "${panel.slice(0, 160)}"; links to the assignment: ${link}`;
});

await step("J08", "student 1 opens the lesson from the home, starts the pre-test and answers all of it (2 of 4 right, by plan)", ["STU-04", "STU-05", "STU-06", "STU-07", "STU-10", "X-06"], async (rec) => {
  rec.page = S;
  if (!tugas || !cards[0]) return blocked(rec, "J07 did not get in");
  await S.locator(`section.pin-lanjut a[href="/belajar/${tugas}"]`).first().click();
  await S.waitForURL((u) => u.pathname === `/belajar/${tugas}`, { timeout: SLOW });
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-tugas"));
  const trail = await text(S, "ol.pin-jejak");
  await S.locator("section.pin-lanjut").getByRole("link", { name: "Mulai", exact: true }).click();
  await S.waitForURL((u) => u.pathname === `/belajar/${tugas}/pemetaan`, { timeout: SLOW });
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-orientasi"));
  const orient = await text(S);
  const p = person(names[0]);
  const before = sesi(p, "PRE_TEST");
  await S.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
  const r = await jawab(S, "pre", PLAN[0].pre);
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-peta"));
  const after = sesi(p, "PRE_TEST");
  if (!after.startsWith("FINALIZED") || r.unknown) rec.verdict = "FAIL";
  return `trail: "${trail}"; orientation: "${orient.slice(0, 160)}"; session before pressing: ${before || "none"}; answered ${r.answered}, meant right ${r.right}, not in the key ${r.unknown}; now on ${new URL(S.url()).pathname}; session ${after}`;
});

const lessonRows = () => sql(`select string_agg(l.ordinal || ':' || coalesce(lp.furthest_position::text, '-') || '/' || coalesce(lp.total_positions::text, '-'), ' ' order by l.ordinal)
  from public.lessons l join public.modules m on m.id = l.module_id
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.person_id = ${uuid(person(names[0]))}
  where m.course_id = ${uuid(course)}`);
await step("J09", "student 1 reads every lesson to its last page, from the reading map, by clicking", ["STU-11", "X-07"], async (rec) => {
  rec.page = S;
  if (!tugas || !new URL(S.url()).pathname.endsWith("/peta")) return blocked(rec, "the student is not on the reading map");
  await S.getByRole("link", { name: "Buka pelajarannya" }).first().click();
  await S.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
  const read = [];
  for (let n = 0; n < 12; n++) {
    await S.locator("h1").first().waitFor({ timeout: SLOW });
    const title = norm(await S.locator("h1").first().innerText());
    let pages = 1;
    const nextPage = S.getByRole("button", { name: "Halaman berikutnya", exact: true });
    while (await nextPage.isEnabled().catch(() => false)) {
      const pos = await text(S, "p.pin-lpos");
      await nextPage.click();
      await S.waitForFunction((prev) => document.querySelector("p.pin-lpos")?.innerText.replace(/\s+/g, " ").trim() !== prev, pos, { timeout: SLOW });
      pages++;
    }
    await S.waitForTimeout(1500); // the last page's position is saved on view
    const media = await S.locator("video, audio, a.pin-llink").count();
    read.push(`${title.slice(0, 32)} (${pages} page${pages > 1 ? "s" : ""}${media ? `, ${media} media not played` : ""})`);
    rec.shots.push(await shot(S, `siswa1-pelajaran-${n + 1}`));
    const nextLesson = S.getByRole("link", { name: "Pelajaran berikutnya" });
    if (!(await nextLesson.count())) break;
    const here = S.url();
    await nextLesson.first().click();
    await S.waitForURL((u) => u.href !== here, { timeout: SLOW });
  }
  const last = await text(S);
  const postLink = await S.locator(`a[href="/belajar/${tugas}/penguasaan"]`).count();
  const rows = lessonRows();
  const allRead = rows.split(" ").every((r) => { const [f, t] = r.split(":")[1].split("/"); return t !== "-" && Number(f) >= Number(t); });
  rec.lessons = rows;
  if (!allRead) { rec.verdict = "FAIL"; rec.kind = "product"; }
  return `read ${read.length} lessons: ${read.join("; ")}; on the last lesson, a link to Uji Penguasaan: ${postLink > 0}; ` +
    `saved reading positions (lesson:furthest/total): ${rows}; every lesson counts as read: ${allRead}; the last page says: "${last.slice(-220)}"`;
});

await step("J10", "after reading everything, the student can reach the post-test by clicking (home, lesson page, trail)", ["STU-13"], async (rec) => {
  rec.page = S;
  if (!tugas) return blocked(rec, "nothing assigned");
  const where = [];
  await S.goto(`${APP}/belajar`, { timeout: SLOW }); await S.locator("h1").first().waitFor({ timeout: SLOW }); await closeTour(S);
  const home = await S.locator(`a[href="/belajar/${tugas}/penguasaan"]`).count();
  const homePanel = await text(S, "section.pin-lanjut");
  rec.shots.push(await shot(S, "siswa1-beranda-setelah-baca"));
  await S.goto(`${APP}/belajar/${tugas}`, { timeout: SLOW }); await S.locator("h1").first().waitFor({ timeout: SLOW });
  const tugasLink = await S.locator(`a[href="/belajar/${tugas}/penguasaan"]`).count();
  const tugasPanel = await text(S, "section.pin-lanjut");
  const pills = (await S.locator("a.pin-row .pin-pill").allTextContents()).map(norm);
  rec.shots.push(await shot(S, "siswa1-tugas-setelah-baca"));
  where.push(`home: ${home} link(s), panel "${homePanel.slice(0, 120)}"`, `assignment page: ${tugasLink} link(s), panel "${tugasPanel.slice(0, 120)}", lesson pills ${JSON.stringify(pills)}`);
  if (home + tugasLink === 0) { rec.verdict = "FAIL"; rec.kind = "product"; }
  return where.join("; ");
});

await step("J11", "student 1 takes the post-test and hands it in (7 of 8 right, by plan)", ["STU-14", "X-08"], async (rec) => {
  rec.page = S;
  if (!tugas) return blocked(rec, "nothing assigned");
  const viaUi = await S.locator(`a[href="/belajar/${tugas}/penguasaan"]`).count();
  if (viaUi) await S.locator(`a[href="/belajar/${tugas}/penguasaan"]`).first().click();
  else await S.goto(`${APP}/belajar/${tugas}/penguasaan`, { timeout: SLOW });
  await S.waitForURL((u) => u.pathname === `/belajar/${tugas}/penguasaan`, { timeout: SLOW });
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-orientasi-penguasaan"));
  await S.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
  const r = await jawab(S, "post", PLAN[0].post);
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  const after = sesi(person(names[0]), "POST_TEST");
  if (!after.startsWith("FINALIZED") || r.unknown) rec.verdict = "FAIL";
  return `${viaUi ? "opened from a link" : "WORKAROUND: opened by typing /belajar/<tugas>/penguasaan (no link offered, J10)"}; answered ${r.answered}, meant right ${r.right}, not in the key ${r.unknown}; now on ${new URL(S.url()).pathname}; session ${after}`;
});

async function hasil(page, plan) {
  const t = await text(page);
  const m = t.match(/Terjawab tepat (\d+) dari (\d+) soal/);
  const big = norm(await page.locator("p.pin-big2").first().innerText().catch(() => ""));
  const delta = t.match(/(\d+)\s*%\s*→\s*(\d+)\s*%/);
  const want = { right: plan.post, of: 8, pct: Math.round((100 * plan.post) / 8), pre: Math.round((100 * plan.pre) / 4) };
  const ok = m && Number(m[1]) === want.right && Number(m[2]) === want.of && Math.abs(parseInt(big, 10) - want.pct) <= 1
    && (!delta || (Math.abs(Number(delta[1]) - want.pre) <= 1 && Math.abs(Number(delta[2]) - want.pct) <= 1));
  return { ok, said: `${big}; "${m?.[0] ?? "no 'Terjawab tepat' line"}"; change ${delta ? `${delta[1]}% → ${delta[2]}%` : "not shown"}`, want: `${want.right}/8 = ${want.pct}%, pre ${want.pre}%`, t };
}
await step("J12", "student 1 reads the result: the numbers match what was answered; review; what next", ["STU-15", "STU-16", "STU-17", "STU-18", "X-09"], async (rec) => {
  rec.page = S;
  if (!new URL(S.url()).pathname.endsWith("/hasil")) return blocked(rec, "not on the result page");
  rec.shots.push(await shot(S, "siswa1-hasil"));
  const h = await hasil(S, PLAN[0]);
  const review = await S.locator("details.pin-item").count();
  const rank = /peringkat|rata-rata kelas/i.test(h.t);
  await S.getByRole("link", { name: /Apa berikutnya/ }).first().click();
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-lanjut"));
  const next = await text(S);
  if (!h.ok || rank) rec.verdict = "FAIL";
  return `the page says ${h.said}; expected ${h.want}; questions to review: ${review}; any rank or class average: ${rank}; "Apa berikutnya" → ${new URL(S.url()).pathname}: "${next.slice(0, 200)}"`;
});

await step("J13", "students 2-5 sign in with their cards and take both tests to plan (post-test by the same route as J11)", ["STU-01", "STU-06", "STU-10", "STU-14", "STU-15"], async (rec) => {
  if (!tugas) return blocked(rec, "nothing assigned");
  const out = [];
  for (let i = 1; i < names.length; i++) {
    if (!cards[i]) { out.push(`${i + 1}: no card`); rec.verdict = "FAIL"; continue; }
    const P = await newPage(`siswa${i + 1}`, { width: 820, height: 1180 });
    rec.page = P;
    try {
      await masukKartu(P, cards[i]); await closeTour(P);
      await P.locator("section.pin-lanjut").getByRole("link", { name: "Mulai", exact: true }).click();
      await P.waitForURL((u) => u.pathname === `/belajar/${tugas}/pemetaan`, { timeout: SLOW });
      await P.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
      const pre = await jawab(P, "pre", PLAN[i].pre);
      await P.getByRole("link", { name: "Buka pelajarannya" }).first().click();
      await P.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
      await P.waitForTimeout(1500);
      const link = await P.locator(`a[href="/belajar/${tugas}/penguasaan"]`).count();
      if (link) await P.locator(`a[href="/belajar/${tugas}/penguasaan"]`).first().click();
      else await P.goto(`${APP}/belajar/${tugas}/penguasaan`, { timeout: SLOW });
      await P.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
      const post = await jawab(P, "post", PLAN[i].post);
      await P.locator("h1").first().waitFor({ timeout: SLOW });
      const h = await hasil(P, PLAN[i]);
      rec.shots.push(await shot(P, `siswa${i + 1}-hasil`));
      if (!h.ok || pre.unknown || post.unknown) rec.verdict = "FAIL";
      out.push(`${i + 1}: pre ${pre.right}/${pre.answered}, post ${post.right}/${post.answered} → the page says ${h.said} (expected ${h.want})${h.ok ? "" : " MISMATCH"}`);
    } catch (e) {
      rec.verdict = "FAIL"; out.push(`${i + 1}: stopped: ${String(e.message || e).split("\n")[0].slice(0, 200)}`);
      rec.shots.push(await shot(P, `siswa${i + 1}-stopped`));
    }
    await P.context().close();
  }
  return out.join("; ");
});

await step("J14", "the teacher reads the class evidence (Lihat bukti) and who has handed in (Siapa)", ["EDU-09", "EDU-12", "X-10", "ADM-15"], async (rec) => {
  rec.page = G;
  if (!tugas) return blocked(rec, "nothing assigned");
  await lihat(G, `/mengajar/${KID}`);
  const kelasPage = await text(G);
  rec.shots.push(await shot(G, "guru-kelas"));
  await G.locator(`a[href="/mengajar/${KID}/bukti"]`).first().click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${KID}/bukti`, { timeout: SLOW });
  await G.locator("h1").first().waitFor({ timeout: SLOW });
  await closeTour(G);
  rec.shots.push(await shot(G, "guru-bukti"));
  const bukti = await text(G);
  const kumpul = [...bukti.matchAll(/Mengumpulkan\s*(\d+)\s*\/\s*(\d+)/g)].map((m) => `${m[1]}/${m[2]}`);
  const n = names.length;
  // earlier runs' students stay in the class (their cards were never kept), so the roster can be larger than n
  const full = kumpul.filter((k) => k.startsWith(`${n}/`)).length;
  // "who has handed in" is linked from Langkah (only while someone is still pending) and from a running Uji Cepat
  await lihat(G, `/mengajar/${KID}`);
  await G.locator(`a[href="/mengajar/${KID}/langkah"]`).first().click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${KID}/langkah`, { timeout: SLOW });
  await G.locator("h1").first().waitFor({ timeout: SLOW });
  await closeTour(G);
  rec.shots.push(await shot(G, "guru-langkah"));
  const langkah = await text(G);
  const siapa = `Langkah: "${langkah.slice(0, 300)}"; a link to Siapa there: ${await G.locator(`a[href^="/mengajar/${KID}/siapa"]`).count()}`;
  if (full < 2) rec.verdict = "FAIL";
  return `Mengumpulkan: ${JSON.stringify(kumpul)} (both tests ${n} handed in expected); ${siapa}; the evidence page says: "${bukti.slice(0, 900)}"; the class page: "${kelasPage.slice(0, 200)}"`;
});

// ---------------------------------------------------------------- the Question Bank (D-050), apart from the journey
async function bank(page, who) {
  await lihat(page, "/studio/bank");
  const t = await text(page);
  const ids = [...t.matchAll(/\b([0-9a-f]{8})\b/g)].map((m) => m[1]);
  const mine = new Set(sql(`select string_agg(left(id::text, 8), ' ') from public.items where institution_id = ${uuid(SID)}`).split(" "));
  const thisCourse = new Set(sql(`select string_agg(left(i.id::text, 8), ' ') from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = ${uuid(course)}`).split(" "));
  const shown = page.locator("main li");
  return { t, n: await shown.count(), ids, foreign: ids.filter((x) => !mine.has(x)).length, ofCourse: ids.filter((x) => thisCourse.has(x)).length,
           noEvidence: (t.match(/Belum cukup bukti untuk menilai soal ini\./g) ?? []).length, shot: await shot(page, `bank-${who}`) };
}
for (const [id, who, page] of [["Q1", "teacher", G], ["Q2", "admin", A]]) {
  await step(id, `Bank Soal as the ${who}: the uploaded questions are listed, and nothing from another school`, ["D-050 bank"], async (rec) => {
    rec.page = page;
    if (!course) return blocked(rec, "no course");
    const b = await bank(page, who);
    rec.shots.push(b.shot);
    if (b.foreign > 0 || b.ofCourse === 0) rec.verdict = "FAIL";
    return `${b.n} list rows; item ids shown ${b.ids.length}, of this upload ${b.ofCourse}/28 (the page lists the newest 40), from another school ${b.foreign}; "Belum cukup bukti untuk menilai soal ini." on ${b.noEvidence}`;
  });
}

let cepat = null;
await step("Q3", "the teacher launches an Uji Cepat of 5 questions from Bab 1's bank for the class (Atur → Tinjau → Sediakan)", ["EDU-07"], async (rec) => {
  rec.page = G;
  if (!tugas) return blocked(rec, "nothing assigned");
  await lihat(G, `/mengajar/${KID}/uji-cepat`);
  const running = /Uji Cepat sedang berjalan/.test(await text(G));
  if (running) { rec.verdict = "NOTE"; return "an Uji Cepat is already running in this class; not launching another"; }
  const bab = G.locator("#pin-bab");
  const options = (await bab.locator("option").allTextContents()).map(norm);
  await G.locator("#pin-soal").fill("5");
  await G.locator('input[name="menit"][value="10"]').check().catch(() => {});
  rec.shots.push(await shot(G, "cepat-atur"));
  await G.getByRole("button", { name: "Lanjut ke tinjauan", exact: true }).click();
  await G.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).waitFor({ timeout: SLOW });
  rec.shots.push(await shot(G, "cepat-tinjau"));
  await G.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).click();
  await G.getByText("Uji Cepat sedang berjalan").first().waitFor({ timeout: SLOW }).catch(() => {});
  rec.shots.push(await shot(G, "cepat-hidup"));
  const t = await text(G);
  cepat = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
    where aa.node_id = ${uuid(KID)} and d.mode::text = 'QUICK' order by aa.created_at desc limit 1`);
  if (!/Uji Cepat sedang berjalan/.test(t) || !cepat) rec.verdict = "FAIL";
  return `chapters offered: ${JSON.stringify(options)}; the page now: "${t.slice(0, 260)}"`;
});

await step("Q4", "student 1 finds the Uji Cepat on /belajar (Bisa dikerjakan sekarang), takes it and hands it in", ["EDU-08"], async (rec) => {
  rec.page = S;
  if (!cepat) return blocked(rec, "no Uji Cepat");
  await S.goto(`${APP}/belajar`, { timeout: SLOW }); await S.locator("h1").first().waitFor({ timeout: SLOW }); await closeTour(S);
  rec.shots.push(await shot(S, "siswa1-cepat-beranda"));
  const link = S.locator(`a[href="/belajar/asesmen/${cepat}"]`);
  if (!(await link.count())) { rec.verdict = "FAIL"; return `no link to it on /belajar: "${(await text(S)).slice(0, 300)}"`; }
  await link.first().click();
  await S.waitForURL((u) => u.pathname === `/belajar/asesmen/${cepat}`, { timeout: SLOW });
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  const start = S.locator("main button[type=submit].pin-primary").first();
  const label = norm(await start.innerText());
  await start.click();
  const r = await jawab(S, "post", 3);
  await S.locator("h1").first().waitFor({ timeout: SLOW });
  rec.shots.push(await shot(S, "siswa1-cepat-selesai"));
  const s = sql(`select status::text from public.assessment_sessions where assessment_assignment_id = ${uuid(cepat)} and person_id = ${uuid(person(names[0]))} order by created_at desc limit 1`);
  if (s !== "FINALIZED") rec.verdict = "FAIL";
  return `start button "${label}"; answered ${r.answered}, meant right ${r.right}, not in the key ${r.unknown}; now on ${new URL(S.url()).pathname}; session ${s}`;
});

await step("Q5", "the teacher sees the Uji Cepat hand-in (count and who)", ["EDU-09", "EDU-10"], async (rec) => {
  rec.page = G;
  if (!cepat) return blocked(rec, "no Uji Cepat");
  await lihat(G, `/mengajar/${KID}/uji-cepat`);
  const t = await text(G);
  rec.shots.push(await shot(G, "cepat-guru-setelah"));
  const kumpul = t.match(/Sudah mengumpulkan\s*(\d+)\s*\/\s*(\d+)/);
  let siapa = "no Siapa link";
  const sl = G.locator(`a[href="/mengajar/${KID}/siapa?penugasan=${cepat}"]`);
  if (await sl.count()) {
    await sl.first().click();
    await G.waitForURL((u) => u.pathname === `/mengajar/${KID}/siapa`, { timeout: SLOW });
    await G.locator("h1").first().waitFor({ timeout: SLOW });
    rec.shots.push(await shot(G, "cepat-siapa"));
    const st = await text(G);
    const sudah = st.split("Belum mengumpulkan")[0];
    siapa = `Siapa: student 1 under "Sudah mengumpulkan": ${sudah.includes(names[0])}; students 2-5 named anywhere: ${names.slice(1).filter((x) => st.includes(x)).length}/4`;
    if (!sudah.includes(names[0])) rec.verdict = "FAIL";
  }
  if (!kumpul || Number(kumpul[1]) < 1) rec.verdict = "FAIL";
  return `"${kumpul?.[0] ?? "no count"}"; ${siapa}; the page: "${t.slice(0, 300)}"`;
});

await step("Q6", "question health (Head of Department)", ["HOD-06"], async (rec) => {
  rec.verdict = "NOT RUN";
  return "not walked: the synthetic school has no Head of Department, and a health signal needs 30 answers per question (item.* minimum_sample 30)";
});

await browser.close();
const byVerdict = steps.reduce((m, s) => ((m[s.verdict] = (m[s.verdict] ?? 0) + 1), m), {});
writeFileSync(join(OUT, "journey.json"), JSON.stringify({ tag: TAG, school: SID, kelas: KID, course, release, tugas, cepat, plan: PLAN, steps, seen }, null, 2));
log(`\nTALLY ${JSON.stringify(byVerdict)}; server 5xx ${seen.server5xx.length}; page errors ${seen.pageErrors.length}`);
for (const e of [...seen.server5xx, ...seen.pageErrors].slice(0, 20)) log(`  ${JSON.stringify(e)}`);
if (steps.some((s) => s.verdict === "FAIL")) process.exitCode = 1;

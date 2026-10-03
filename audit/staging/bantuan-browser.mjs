// STAGING ONLY. The assistance check and the offline notice, seen in a real browser (owner ruling, 2 Oct: option A;
// «Tutup»; the event-driven check, main 7d84637). One synthetic learner of «Kelas Uji Kinerja A» sits the latest chapter
// the staging walk gave the class, in Chromium, with every request the page makes recorded:
//
//   B0  read only: the chapter, its tests' help window (from the definitions), a learner with no sitting on it, and
//       whether any assessment on staging is without a window («no help configured»); the database's clock.
//   B1  SETUP, not journey evidence: the learner's session is made on the server by Auth's admin link, as the L1 browser
//       harness makes its sessions (perf/lib.mjs). Sign-in is not what this walk verifies.
//   B2  the Pemetaan Awal in the browser, each answer within a few seconds: no help check at all, no probe, every
//       answer taken.
//   B3  the Uji Penguasaan, question 1 left unanswered: the offer appears at the server's due point (its own first
//       view + the window), after exactly one help check and none before; «Sudah cukup, terima kasih» («Tutup»)
//       closes it and nothing reopens it for 35 s, with no check and no request to PINTAR at all while idle; then the
//       answer is saved.
//   B4  question 2 answered after a few seconds: no help check, no offer, nothing granted.
//   B5  question 3 left until the offer, then answered: one check after the answer, and the offer goes.
//   B6  question 4, the browser goes offline (a real `offline`): the notice appears; the save is held; the light
//       recovery check runs (a HEAD of a static file, every 5 s); back online, the notice clears, the held answer is
//       sent and «Tersimpan» shows, and the recovery check stops.
//   B7  question 5, PINTAR unreachable while the browser still believes it is online (every request to staging
//       refused): the failed save turns the notice on; the recovery check runs; when PINTAR answers again the first
//       successful check clears the notice and the checks stop. Whether the held answer is sent then, before the
//       hand-in, is recorded as seen.
//   B8  the rest answered and saved; «Kumpulkan»; the result page.
//   B9  read back, read only: the sitting FINALIZED with every answer stored once; help granted for questions 1 and 3
//       only, each 25 s or more after its first view; the telemetry of the offer and the close.
//   «No help configured» is checked as a fact of staging (B0): if no assessment lacks a window it cannot be walked
//   here, and EFF-K01 executes that case.
//
// NEVER: production; a direct write (the database is read in read-only transactions; every write is the learner's
// own press in the page); a claim that the server-made session is a person's sign-in.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour, session, sessionCookies } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
mkdirSync(join(OUT, "shots"), { recursive: true });

const SEKOLAH = "Sekolah Uji Kinerja (sintetis)", KELAS = "Kelas Uji Kinerja A";
const PROBE = "/brand/pintar-selalu-logo.png";
const OFFER = "section.pin-bantuan";
const TUTUP = "Sudah cukup, terima kasih";
const LURING = "Sedang luring";

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));
const s1 = (ms) => `${(ms / 1000).toFixed(1)} s`;

const results = [];
let shotN = 0;
async function shot(page, name) {
  await page.screenshot({ path: join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`), fullPage: true }).catch(() => {});
}
async function step(id, title, fn) {
  const rec = { verdict: "PASS" };
  let detail;
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n")[0].slice(0, 300); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(7)} ${id}  ${title} :: ${detail}`);
  return rec.verdict;
}

// ── every request the page makes to PINTAR, and what each server action answered
const asal = new URL(APP).origin;
const idBantuan = new Set(); // the help check's server-action id, learned from its answers
const jejak = []; // { t, kind: "aksi"|"probe"|"rsc"|"halaman"|"lain", jenis?: "bantuan"|"lihat"|"lain", ok, gagal? }
function rekam(page) {
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.origin !== asal || u.pathname.startsWith("/_next/static")) return;
    const h = req.headers();
    const kind = u.pathname === PROBE && req.method() === "HEAD" ? "probe"
      : req.method() === "POST" && h["next-action"] ? "aksi" : h["rsc"] ? "rsc" : req.resourceType() === "document" ? "halaman" : "lain";
    if (kind === "lain" && /\.(png|svg|ico|woff2?|css|js|jpg|webp)$/.test(u.pathname)) return;
    const e = { t: Date.now(), kind, ok: null, aksiId: h["next-action"] ?? null };
    jejak.push(e);
    req.__e = e;
  });
  page.on("response", async (res) => {
    const e = res.request().__e;
    if (!e) return;
    e.ok = res.ok();
    if (e.kind !== "aksi") return;
    const body = await res.text().catch(() => "");
    // assistance answers { ok, state: { windowSeconds, …, due } }; noteView answers { ok, at, dwellSeconds }
    e.jenis = /"state":\{[^}]*"due":(true|false)/.test(body) ? "bantuan" : /"at":"[^"]+","dwellSeconds"/.test(body) ? "lihat" : "lain";
    if (e.jenis === "bantuan" && e.aksiId) idBantuan.add(e.aksiId);
    e.due = /"due":true/.test(body);
  });
  page.on("requestfailed", (req) => {
    const e = req.__e;
    if (e) { e.ok = false; e.gagal = String(req.failure()?.errorText ?? "failed").slice(0, 60); }
  });
}
const dalam = (a, b, f = () => true) => jejak.filter((e) => e.t >= a && e.t < b && f(e));
// every recovery check the page itself starts, counted in the page (window.fetch, as the player calls it): a request the
// browser refuses while offline may never reach the network log; the larger of the two counts is used
const diHalaman = async () => (await page.evaluate(() => window.__periksa ?? []).catch(() => [])) || [];
async function periksaDalam(a, b, f = () => true) {
  const di = (await diHalaman()).filter((e) => e.t >= a && e.t < b && f(e)).length;
  return Math.max(di, dalam(a, b, (e) => probe(e) && f(e)).length);
}
const bantuan = (e) => e.kind === "aksi" && e.jenis === "bantuan";
const probe = (e) => e.kind === "probe";

let S = null, page = null, ctx = null;
let offset = 0; // the database's clock minus the runner's, in ms
const browser = await chromium.launch();

await step("B0", `read only: «${KELAS}»'s latest chapter, its help window, a learner with no sitting on it; staging without a window`, async (rec) => {
  const r = sql(`with k as (select n.id from public.org_nodes n join public.institutions i on i.id = n.institution_id
                  where i.name = ${lit(SEKOLAH)} and n.kind = 'CLASS' and n.name = ${lit(KELAS)} and n.is_active),
      la as (select aa.learning_assignment_id id from public.assessment_assignments aa
                join public.assessment_definitions d on d.id = aa.assessment_definition_id
               where aa.node_id = (select id from k) and aa.status = 'OPEN' and d.mode = 'POST_TEST'
                 and aa.learning_assignment_id is not null and (aa.closes_at is null or aa.closes_at > now() + interval '1 hour')
               order by aa.created_at desc limit 1)
    select (select id from la) || '|' ||
      (select string_agg(d.mode::text || ':' || coalesce(d.hesitation_window_seconds::text, 'none'), ',' order by d.mode::text)
         from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
        where aa.learning_assignment_id = (select id from la)) || '|' ||
      (select e.person_id || ':' || u.email from public.memberships m
         join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE'
         join public.accounts ac on ac.person_id = e.person_id join auth.users u on u.id = ac.auth_user_id
        where m.node_id = (select id from k) and m.valid_to is null and u.email is not null
          and not exists (select 1 from public.assessment_sessions s where s.person_id = e.person_id and s.learning_assignment_id = (select id from la))
        order by e.person_id limit 1) || '|' ||
      (select count(*) from public.assessment_definitions where hesitation_window_seconds is null) || '|' ||
      (select count(*) from public.assessment_definitions) || '|' ||
      (select min(hesitation_window_min) || '-' || max(hesitation_window_max) from public.assessment_definition_bounds)`);
  const [tugas, jendela, orang, tanpa, semua, batas] = r.split("|");
  if (!tugas || !orang) { rec.verdict = "FAIL"; return `no open chapter or no learner without a sitting in «${KELAS}» (${r})`; }
  const [person, email] = orang.split(":");
  S = { tugas: uuid(tugas), person: uuid(person), email, jendela };
  const t0 = Date.now(); const db = Number(sql("select extract(epoch from clock_timestamp()) * 1000")); const t1 = Date.now();
  offset = db - (t0 + t1) / 2;
  return `chapter ${tugas.slice(0, 8)}…, windows ${jendela}; learner ${person.slice(0, 8)}…; ${tanpa} of ${semua} assessments on staging have no window ` +
    `(the platform bounds allow ${batas} s), so «no help configured» ${Number(tanpa) ? "exists" : "cannot be walked here"}; clocks differ by ${s1(offset)} (±${s1(t1 - t0)})`;
});

await step("B1", "SETUP (not journey evidence): the learner's session made on the server by Auth's admin link, as the L1 browser harness does", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "B0 found no learner"; }
  const sess = await session(S.email);
  ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await ctx.addInitScript((alamat) => {
    window.__periksa = [];
    const asli = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input?.url ?? String(input);
      const p = asli(input, init);
      if (url.includes(`${alamat}?periksa=`)) {
        const e = { t: Date.now(), ok: null };
        window.__periksa.push(e);
        p.then((r) => { e.ok = r.ok; }, () => { e.ok = false; });
      }
      return p;
    };
  }, PROBE);
  await ctx.addCookies(sessionCookies(sess).map((c) => ({ ...c, expires: -1 })));
  page = await ctx.newPage();
  rekam(page);
  await page.goto(`${APP}/belajar`, { timeout: SLOW, waitUntil: "networkidle" });
  await closeTour(page);
  return `landed ${new URL(page.url()).pathname}`;
});

// answer the question on screen: the first option; in the Uji Penguasaan, «Simpan jawaban ini» until «Tersimpan»
async function pilih() {
  const opsi = page.locator("ul.pin-opsi button.pin-op").first();
  await opsi.waitFor({ state: "visible", timeout: SLOW });
  await opsi.click();
}
async function simpan(tunggu = true) {
  await page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ }).click();
  if (tunggu) await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
}
async function berikutnya() {
  const stem = await page.locator("h2.pin-stem").first().innerText();
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, stem, { timeout: SLOW });
  return Date.now();
}
const ditawarkan = async () => (await page.locator(OFFER).count()) > 0;

await step("B2", "the Pemetaan Awal in the browser, each answer within a few seconds: no help check, no probe, every answer taken", async (rec) => {
  if (!page) { rec.verdict = "NOT RUN"; return "no learner session"; }
  await page.goto(`${APP}/belajar/${S.tugas}/pemetaan`, { timeout: SLOW, waitUntil: "networkidle" });
  await closeTour(page);
  const a = Date.now();
  await page.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
  let n = 0;
  for (; n < 40; n++) {
    await page.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: SLOW });
    await tunggu(1500);
    await pilih();
    await tunggu(800);
    if (await page.getByRole("button", { name: "Berikutnya", exact: true }).count()) { await berikutnya(); continue; }
    await page.getByRole("button", { name: "Selesaikan pemetaan", exact: true }).click();
    await page.waitForURL((u) => !u.pathname.endsWith("/pemetaan"), { timeout: 60000 });
    break;
  }
  await page.waitForLoadState("networkidle");
  const b = Date.now();
  const cek = dalam(a, b, bantuan).length, pr = await periksaDalam(a, b);
  const simpanan = sql(`select count(*) || '/' || (select count(*) from public.presented_items p where p.session_id = s.id) || '|' || s.status
      from public.assessment_sessions s join public.responses r on r.session_id = s.id and r.is_final
     where s.person_id = '${S.person}' and s.learning_assignment_id = '${S.tugas}' and s.mode = 'PRE_TEST' group by s.id, s.status`);
  if (cek || pr || !/^(\d+)\/\1\|FINALIZED$/.test(simpanan)) rec.verdict = "FAIL";
  return `${n + 1} questions in ${s1(b - a)}; help checks ${cek}, probes ${pr}; answers stored ${simpanan}; landed ${new URL(page.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>")}`;
});

// the Uji Penguasaan's presented items, by stem: the server's first view of each, and what it granted
let SESI = null;
const butir = new Map();
function bacaSesi() {
  SESI = SESI ?? sql(`select s.id from public.assessment_sessions s where s.person_id = '${S.person}' and s.learning_assignment_id = '${S.tugas}' and s.mode = 'POST_TEST'`);
  for (const row of sql(`select p.id || chr(31) || p.position || chr(31) || replace(replace(i.stem, chr(13), ' '), chr(10), ' ') || chr(31) ||
        coalesce((extract(epoch from v.first_viewed_at) * 1000)::bigint::text, '') || chr(31) ||
        coalesce((select (extract(epoch from min(g.granted_at)) * 1000)::bigint::text from public.assistance_grants g where g.presented_item_id = p.id and g.level = 0), '')
      from public.presented_items p join public.items i on i.id = p.item_id
      left join public.presented_item_views v on v.presented_item_id = p.id
     where p.session_id = '${uuid(SESI)}' order by p.position`).split("\n").filter(Boolean)) {
    const [id, pos, stem, lihat, beri] = row.split("\x1f");
    butir.set(norm(stem), { id, pos: Number(pos), lihat: lihat ? Number(lihat) : null, beri: beri ? Number(beri) : null });
  }
}
const kini = async () => butir.get(norm(await page.locator("h2.pin-stem").first().innerText()));

let mulaiUji = 0;
// B7: whether question 5's held answer was still held after PINTAR answered again (then the server, not having it,
// counts the question as unanswered and may offer help once the window passes)
let q5Tertahan = false, q5Ditawari = false;
// the whole Uji Penguasaan page's recovery checks, read before the hand-in navigates away (B8)
let probeTotal = 0;
await step("B3", "question 1 left unanswered: the offer at the server's due point after one check and none before; «Tutup» keeps it closed 35 s with nothing sent; then saved", async (rec) => {
  if (!page) { rec.verdict = "NOT RUN"; return "no learner session"; }
  await page.goto(`${APP}/belajar/${S.tugas}/penguasaan`, { timeout: SLOW, waitUntil: "networkidle" });
  await closeTour(page);
  await page.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
  await page.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: SLOW });
  const tampil = mulaiUji = Date.now();
  await page.locator(OFFER).waitFor({ state: "visible", timeout: 60000 });
  const muncul = Date.now();
  await shot(page, "b3-tawaran");
  bacaSesi();
  const q = await kini();
  const sebelum = dalam(tampil, muncul, bantuan);
  // the offer on the database's clock, against the server's own due point
  const telat = muncul + offset - (q.lihat + 25_000);
  const out = [`offer ${s1(muncul - tampil)} after the question appeared; ${s1(telat)} after the server's due point (its first view + 25 s)`,
    `help checks before it ${sebelum.length} (${sebelum.filter((e) => e.due).length} answered due)`,
    `granted ${q.beri ? s1(q.beri - q.lihat) : "never"} after the first view`];
  const tepat = sebelum.length === 1 && sebelum[0].due && telat >= -1500 && telat <= 4000 && q.beri && q.beri - q.lihat >= 25_000;
  // «Tutup»: closed and kept closed, nothing asked, nothing sent while idle
  await page.getByRole("button", { name: TUTUP, exact: true }).click();
  await page.locator(OFFER).waitFor({ state: "detached", timeout: SLOW });
  const tutup = Date.now();
  let terbuka = 0;
  for (let i = 0; i < 35; i++) { await tunggu(1000); if (await ditawarkan()) terbuka++; }
  const akhir = Date.now();
  const diam = dalam(tutup + 2000, akhir);
  out.push(`«${TUTUP}»: reopened in ${terbuka} of 35 one-second looks; help checks after it ${dalam(tutup, akhir, bantuan).length}; requests to PINTAR while idle (after the close's own) ${diam.length}`);
  await pilih();
  const s0 = Date.now();
  await simpan();
  out.push(`saved in ${Date.now() - s0} ms`);
  if (!tepat || terbuka || dalam(tutup, akhir, bantuan).length || diam.length) rec.verdict = "FAIL";
  return out.join("; ");
});

await step("B4", "question 2 answered after a few seconds: no help check, no offer, nothing granted", async (rec) => {
  if (!page || !SESI) { rec.verdict = "NOT RUN"; return "B3 did not start the sitting"; }
  const a = await berikutnya();
  await tunggu(4000);
  await pilih();
  await simpan();
  await tunggu(2000);
  const b = Date.now();
  bacaSesi();
  const q = await kini();
  const cek = dalam(a, b, bantuan).length;
  if (cek || (await ditawarkan()) || q.beri) rec.verdict = "FAIL";
  return `help checks ${cek}; offer ${await ditawarkan() ? "shown" : "none"}; granted ${q.beri ? "yes" : "nothing"}`;
});

await step("B5", "question 3 left until the offer, then answered: one check after the answer, and the offer goes", async (rec) => {
  if (!page || !SESI) { rec.verdict = "NOT RUN"; return "B3 did not start the sitting"; }
  const a = await berikutnya();
  await page.locator(OFFER).waitFor({ state: "visible", timeout: 60000 });
  const muncul = Date.now();
  await pilih();
  const jawab = Date.now();
  await simpan();
  await tunggu(4000);
  const b = Date.now();
  const sebelum = dalam(a, muncul, bantuan).length, sesudah = dalam(jawab, b, bantuan).length;
  const masih = await ditawarkan();
  if (sebelum !== 1 || sesudah !== 1 || masih) rec.verdict = "FAIL";
  return `offer after ${s1(muncul - a)}; checks before it ${sebelum}, after the answer ${sesudah}; offer ${masih ? "still shown" : "gone"}`;
});

await step("B6", "question 4, the browser offline: the notice; the save held; the recovery check every 5 s; back online the notice clears, «Tersimpan», the checks stop", async (rec) => {
  if (!page || !SESI) { rec.verdict = "NOT RUN"; return "B3 did not start the sitting"; }
  const sebelum = await periksaDalam(0, Date.now());
  await berikutnya();
  await tunggu(2000);
  await pilih();
  const putus = Date.now();
  await ctx.setOffline(true);
  await page.getByText(LURING).first().waitFor({ state: "visible", timeout: 10000 });
  const muncul = Date.now();
  await simpan(false);
  await tunggu(12_000);
  const tersimpanLuring = await page.getByRole("button", { name: "Tersimpan", exact: true }).count();
  await shot(page, "b6-luring");
  const sambung = Date.now();
  await ctx.setOffline(false);
  await page.getByText(LURING).first().waitFor({ state: "detached", timeout: 15000 });
  const hilang = Date.now();
  await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
  const terkirim = Date.now();
  await tunggu(15_000);
  const akhir = Date.now();
  const luring = await periksaDalam(putus, sambung), setelah = await periksaDalam(hilang + 1000, akhir);
  if (sebelum || !luring || setelah || tersimpanLuring) rec.verdict = "FAIL";
  return `probes while online before this ${sebelum}; notice ${s1(muncul - putus)} after going offline; the save held (no «Tersimpan» offline: ${tersimpanLuring === 0}); ` +
    `recovery checks while offline ${luring} in ${s1(sambung - putus)}; notice gone ${s1(hilang - sambung)} after reconnecting; «Tersimpan» ${s1(terkirim - sambung)} after; checks in the 15 s after ${setelah}`;
});

await step("B7", "question 5, PINTAR unreachable while the browser believes it is online (item 17): the notice; no help check for the held answer through the window; the first successful check sends it at once, «Tersimpan» only after the server has it, once; the checks stop", async (rec) => {
  if (!page || !SESI) { rec.verdict = "NOT RUN"; return "B3 did not start the sitting"; }
  const lihat = await berikutnya();
  await tunggu(2000);
  await pilih();
  const tolak = (route) => route.abort("connectionrefused");
  const kePintar = (u) => u.origin === asal;
  const putus = Date.now();
  await ctx.route(kePintar, tolak);
  await simpan(false);
  const ada = await page.getByText(LURING).first().waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false);
  const muncul = Date.now();
  // unreachable past the question's help window (first view + 25 s), so its scheduled help check falls in the gap
  await tunggu(Math.max(0, lihat + 30_000 - Date.now()));
  const sebelumPulih = await page.getByRole("button", { name: "Tersimpan", exact: true }).count();
  await shot(page, "b7-tak-terjangkau");
  const sambung = Date.now();
  await ctx.unroute(kePintar, tolak);
  const pulih = await page.getByText(LURING).first().waitFor({ state: "detached", timeout: 15000 }).then(() => true, () => false);
  const hilang = Date.now();
  const terkirim = await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: 15000 }).then(() => Date.now(), () => null);
  await tunggu(15_000);
  const akhir = Date.now();
  q5Tertahan = !terkirim;
  q5Ditawari = await ditawarkan();
  // what the server holds for this question: one final answer, when it arrived, and how
  const q = await kini();
  const r = sql(`select count(*) || '|' || coalesce((extract(epoch from min(received_at)) * 1000)::bigint::text, '') || '|' ||
      coalesce(string_agg(distinct receipt_mode::text, ','), '-')
    from public.responses where presented_item_id = '${uuid(q.id)}'`).split("|");
  const [nJawab, diterimaPada, cara] = [Number(r[0]), r[1] ? Number(r[1]) : null, r[2]];
  // «Tersimpan» on the server's acknowledgement: it shows after the server received the answer (database clock)
  const urutan = terkirim && diterimaPada ? terkirim + offset - diterimaPada : null;
  const cekBantuan = dalam(lihat, akhir, (e) => e.kind === "aksi" && idBantuan.has(e.aksiId)).length;
  const cek = await periksaDalam(putus, sambung);
  const sukses = await periksaDalam(sambung, hilang + 500, (e) => e.ok === true);
  const setelah = await periksaDalam(hilang + 1000, akhir);
  const catatan = (await diHalaman()).filter((e) => e.t >= putus - 1000).map((e) => `${s1(e.t - putus)}:${e.ok}`).join(" ");
  const ok = ada && cek && pulih && sukses && !setelah && terkirim && !sebelumPulih && nJawab === 1 && urutan !== null && urutan >= -1500 && !cekBantuan && !q5Ditawari;
  if (!ok) rec.verdict = "FAIL";
  return `notice ${ada ? s1(muncul - putus) + " after the refused save" : "never shown"}; unreachable ${s1(sambung - putus)} (past the window); ` +
    `«Tersimpan» before recovery ${sebelumPulih}; help checks for this question ${cekBantuan} (attempted, any outcome); offer ${q5Ditawari ? "shown" : "none"}; ` +
    `recovery checks while unreachable ${cek}; notice ${pulih ? `cleared ${s1(hilang - sambung)} after PINTAR answered again, on a successful check (${sukses})` : "still shown"}; ` +
    `held answer ${terkirim ? `sent at once: «Tersimpan» ${s1(terkirim - hilang)} after the notice cleared, ${urutan === null ? "?" : s1(urutan)} after the server received it` : "NOT sent on recovery"}; ` +
    `answers held by the server for it ${nJawab} (${cara}); checks in the 15 s after ${setelah}; checks (s after the refusal:ok) ${catatan}`;
});

await step("B8", "the rest answered and saved; «Kumpulkan»; the result page", async (rec) => {
  if (!page || !SESI) { rec.verdict = "NOT RUN"; return "B3 did not start the sitting"; }
  let n = 0;
  while (await page.getByRole("button", { name: "Berikutnya", exact: true }).count()) {
    await berikutnya();
    await tunggu(1500);
    await pilih();
    await simpan();
    n++;
  }
  probeTotal = await periksaDalam(0, Date.now());
  await page.getByRole("button", { name: "Kumpulkan", exact: true }).click();
  const tanya = page.locator('[aria-labelledby="kumpulkan-tanya"]');
  if (await tanya.waitFor({ state: "visible", timeout: SLOW }).then(() => true, () => false)) {
    await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
  }
  await page.waitForURL((u) => u.pathname.endsWith("/hasil"), { timeout: 60000 });
  await page.locator("h1").first().waitFor({ timeout: SLOW });
  const t = norm(await page.locator("main").textContent());
  await shot(page, "b8-hasil");
  return `${n} more answered; result page: «${t.match(/Terjawab tepat \d+ dari \d+ soal/)?.[0] ?? t.slice(0, 80)}»`;
});

await step("B9", "read back: the sitting FINALIZED, every answer stored once; help granted for questions 1 and 3 only, each at or after the window; exactly three help checks on the page; the offer's and the close's telemetry", async (rec) => {
  if (!SESI) { rec.verdict = "NOT RUN"; return "no sitting"; }
  const r = sql(`select s.status || '|' || (select count(*) from public.presented_items p where p.session_id = s.id) || '|' ||
      (select count(distinct r.presented_item_id) from public.responses r where r.session_id = s.id and r.is_final) || '|' ||
      (select count(*) from (select r.presented_item_id from public.responses r where r.session_id = s.id and r.is_final group by 1 having count(*) > 1) d) || '|' ||
      coalesce((select string_agg(p.position || ':' || round(extract(epoch from g.granted_at - v.first_viewed_at)::numeric, 1), ',' order by p.position)
         from public.assistance_grants g join public.presented_items p on p.id = g.presented_item_id
         join public.presented_item_views v on v.presented_item_id = p.id where g.session_id = s.id and g.level = 0), '-') || '|' ||
      coalesce((select string_agg(p.position || ':' || a.kind, ',' order by a.observed_at)
         from telemetry.assistance_events a join public.presented_items p on p.id = a.presented_item_id where a.session_id = s.id), '-') || '|' ||
      (select count(*) from telemetry.hesitation_events h where h.session_id = s.id)
    from public.assessment_sessions s where s.id = '${uuid(SESI)}'`);
  const [status, n, diterima, ganda, diberi, tele, ragu] = r.split("|");
  const posisi = [...butir.values()].sort((a, b) => a.pos - b.pos).map((b) => b.pos);
  // help is expected on questions 1 and 3; on question 5 only if its answer was still held when the window passed (B7)
  const harap = [posisi[0], posisi[2]];
  const g = diberi === "-" ? [] : diberi.split(",").map((x) => x.split(":").map(Number));
  const lain = g.filter(([p]) => !harap.includes(p));
  const ok = status === "FINALIZED" && Number(diterima) === Number(n) && ganda === "0" &&
    g.some(([p]) => p === posisi[0]) && g.some(([p]) => p === posisi[2]) && !lain.length && g.every(([, s]) => s >= 25) && Number(ragu) === g.length &&
    jejak.filter((e) => e.kind === "aksi" && idBantuan.has(e.aksiId)).length === 3;
  if (!ok) rec.verdict = "FAIL";
  const semua = jejak.filter((e) => e.kind === "aksi");
  writeFileSync(join(OUT, "jejak.json"), JSON.stringify(jejak.map((e) => ({ ...e, t: e.t - mulaiUji })), null, 0));
  return `${status}; answers stored ${diterima}/${n}, duplicated ${ganda}; help granted (position: seconds after first view) ${diberi}; telemetry ${tele}; hesitations ${ragu}; ` +
    `the Uji Penguasaan's page: ${semua.length} server actions, ${semua.filter((e) => idBantuan.has(e.aksiId)).length} of them help checks (attempted), ${probeTotal} recovery checks`;
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }

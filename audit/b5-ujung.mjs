// BATCH 5 WALK (owner, 3 Nov: «Batch 5 development GO»; «use focused red/green tests, CI and actual browser journeys»).
// Each act below is done by a person at a screen, by clicking and typing. SQL is used only to prepare a fixture the
// way the product's own paths would leave it (an issued certificate, integrity observations an assessment raised,
// people the intake recorded) and to READ afterwards what the database recorded (audit rows, states), never to act.
//
//   B5-W1  W2.5 (CR-05): the platform admin, in «Seluruh platform», finds a certificate on «Sertifikat sekolah» by its
//          number, opens «Cabut», writes the reason; «Lanjutkan» commits nothing; the in-page confirmation starts on
//          «Batal»; «Cabut sertifikat <no>» revokes it: REVOKED with the reason, certificate.revoked audited, the row
//          says «Dicabut», the public check (verify_certificate) says DICABUT
//   B5-W2  W2.7 (CR-75, CR-77): alpha's admin, on Tinjauan Integritas, sees a sitting named by its learner with each
//          observation its own form; records «Tidak ada…» on one (the other still waits) and refers the other with a
//          note; alpha's dean decides it on /pimpinan; the admin then reads, under «Sudah ditinjau», the case's steps,
//          «Diputuskan», the outcome and the dean's note
//   B5-W3  W2.10 (D-153): alpha's admin sees the waiting list 20 to a page with the count, pages to the rest, and finds
//          one person by searching
//   B5-W4  W3.8 (RV-11): alpha's dean opens the class report: in the staff shell, naming the school, the class and the
//          school year; in print, no navigation
//   B5-W5  W2.18 (J5.13) / UX-37: alpha's Guru opens one learner's page: «Tujuan pembelajaran yang belum tercapai»;
//          /mengajar's running rows open
//   B5-W6  W3.10 / W3.15: alpha's learner's Belajar has no sideways scroll at 640 and 320 px; the tour does not make
//          the page inert
//   B5-W7  accessibility of the new and changed screens (audit/a11y.mjs: axe WCAG 2.2 AA, skip link, title, widths)
//
// Local or CI stack with the synthetic seed: APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_DB_URL. Writes OUT_DIR/b5-ujung.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { periksa } from "./a11y.mjs";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/b5-ujung";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const ORANG = {
  sys: { key: "sys", tujuan: "MENGELOLA:PLATFORM", email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" },
  alpha: { key: "alpha", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  dean: { key: "dean", tujuan: "MEMIMPIN", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  guru: { key: "guru", tujuan: "MENGAJAR", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  siswa: { key: "siswa", tujuan: "BELAJAR", email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" },
};
const TAG = randomBytes(3).toString("hex");

mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const esc = (s) => s.replace(/'/g, "''");
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const jejakSejak = () => Number(sql("select coalesce(max(id), 0) from public.audit_log"));

const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) {
    rec.verdict = "FAIL";
    rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`);
  }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}
async function masuk(browser, p) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) {
    const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
    const pilih = kunci.find((k) => k === p.tujuan) ?? kunci.find((k) => k.split(":")[0] === p.tujuan) ?? kunci[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
    await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  return { context, page };
}
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
}
const a11ySemua = [];
async function aksesibel(rec, page, jalan) {
  // from a fresh load, so the keyboard walk starts at the top of the page, not where the walk's own clicks left focus
  await page.reload({ waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
  if (await lewati.isVisible().catch(() => false)) { await lewati.click().catch(() => {}); await page.reload({ waitUntil: "networkidle" }); }
  const h = await periksa(page);
  const axe = (h.axe ?? []).map((v) => `${v.id}×${v.n}`);
  const luap = Object.entries(h.lebar).filter(([, v]) => v?.meluap).map(([w, v]) => `${w}px→${v.meluap}`);
  a11ySemua.push({ jalan, judul: h.judul, axe: h.axe, lompat: h.lompat, lebar: h.lebar });
  harus(rec, axe.length === 0, `${jalan}: axe clean${axe.length ? ` — ${axe.join(", ")}` : ""}`);
  harus(rec, Boolean(h.lompat?.ada) && !h.judulMasalah, `${jalan}: skip link first (${h.lompat?.pertama}) and its own title «${h.judul}»`);
  harus(rec, luap.length === 0, `${jalan}: no sideways scroll at 320/640/1024/1280${luap.length ? ` — ${luap.join(", ")}` : ""}`);
}

// ── fixtures, as the product's own paths would leave them
const alphaId = sql("select id from public.institutions where slug like 'synth-alpha-%' limit 1");
// (a) an issued certificate of alpha's: prepared and sealed as issuance would (the signature is a fixture's)
const sesiSertifikat = sql(`select s.id from public.assessment_sessions s, lateral public.certificate_eligibility(s.id) e
   where e.eligible and not exists (select 1 from public.certificates c where c.session_id = s.id) order by s.created_at limit 1`);
let sertifikat = sesiSertifikat ? sql(`select x.certificate_id from public.certificate_prepare('${sesiSertifikat}'::uuid, 1::smallint) x`) : "";
if (sertifikat) sql(`select public.certificate_seal('${sertifikat}'::uuid, 1::smallint, repeat('b5w', 30))`);
// (a re-run whose eligible sitting already holds a certificate revokes another issued one)
if (!sertifikat) sertifikat = sql("select id from public.certificates where status = 'ISSUED' order by issued_at desc limit 1");
// (b) two integrity observations an alpha sitting raised
const sesiAlpha = sql(`select s.id || '|' || p.display_name from public.assessment_sessions s join public.persons p on p.id = s.person_id
   where s.institution_id = '${alphaId}' and s.class_node_id is not null and not public.session_is_professional(s.id) order by s.created_at limit 1`);
const [sesiId, namaMuridSesi] = sesiAlpha.split("|");
const sinyal = sesiId ? sql(`insert into public.integrity_signals (session_id, institution_id, category, observed_at)
   values ('${sesiId}', '${alphaId}', 'NAVIGATION', now() - interval '3 minutes'), ('${sesiId}', '${alphaId}', 'VISIBILITY_CHANGE', now() - interval '2 minutes')
   returning id`).split("\n").filter((x) => /^[0-9a-f-]{36}$/.test(x)) : [];
// (c) 25 people the intake recorded in alpha, with no account (alpha first gets its code, as Pendataan gives it; the
//     screen path for that is Batch 4's walk, B4-W0)
if (!sql(`select coalesce(namespace, '') from public.institutions where id = '${alphaId}'`)) {
  sql(`update public.institutions set namespace = (select x from (select chr(65 + (g % 26)) || chr(65 + ((g / 26) % 26)) || 'V' as x
     from generate_series(1, 600) g) q where not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1) where id = '${alphaId}'`);
}
const NAMA_TUNGGU = (i) => `Tunggu Walk ${TAG} ${String(i).padStart(2, "0")}`;
sql(`do $$ declare v uuid; begin
  perform set_config('app.seed_intent', 'synthetic', true);
  for i in 1..25 loop
    insert into public.persons (display_name) values ('Tunggu Walk ${TAG} ' || lpad(i::text, 2, '0')) returning id into v;
    perform public.issue_institutional_id(v, '${alphaId}');
  end loop; end $$`);

const browser = await chromium.launch();
const sesi = {};
for (const [k, p] of Object.entries(ORANG)) sesi[k] = await masuk(browser, p);
const S = sesi.sys.page, A = sesi.alpha.page, D = sesi.dean.page, G = sesi.guru.page, M = sesi.siswa.page;

// ── B5-W1 certificate revocation
await step("B5-W1", "W2.5: the platform admin revokes a certificate on «Sertifikat sekolah», with a reason and the in-page confirmation", async (rec) => {
  if (!harus(rec, Boolean(sertifikat), "an issued certificate exists to revoke")) return;
  const nomor = sql(`select certificate_number from public.certificates where id = '${sertifikat}'`);
  const token = sql(`select verification_token from public.certificates where id = '${sertifikat}'`);
  const sejak = jejakSejak();
  await buka(S, `/konfigurasi/sertifikat?cari=${encodeURIComponent(nomor)}`);
  await shot(S, rec, "sertifikat-daftar");
  await S.locator(`a[data-cabut-sertifikat="${sertifikat}"]`).click();
  await S.locator("#cabut").waitFor({ timeout: SLOW });
  const alasan = `Diterbitkan untuk murid yang salah (uji ${TAG})`;
  await S.locator("#cabut-alasan").fill(alasan);
  await S.getByRole("button", { name: "Lanjutkan" }).click();
  await S.locator("[data-konfirmasi-cabut]").waitFor({ timeout: SLOW });
  harus(rec, sql(`select status from public.certificates where id = '${sertifikat}'`) === "ISSUED", "«Lanjutkan» commits nothing: still ISSUED");
  const fokus = await S.evaluate(() => document.activeElement?.textContent?.trim());
  harus(rec, fokus === "Batal", `focus starts on «Batal» (${fokus})`);
  await shot(S, rec, "sertifikat-konfirmasi");
  await S.getByRole("button", { name: `Cabut sertifikat ${nomor}` }).click();
  await S.getByText(`Sertifikat ${nomor} sudah dicabut`).first().waitFor({ timeout: SLOW });
  await shot(S, rec, "sertifikat-dicabut");
  harus(rec, sql(`select status || '|' || revoked_reason from public.certificates where id = '${sertifikat}'`) === `REVOKED|${alasan}`, "the certificate is REVOKED with the reason");
  harus(rec, sql(`select count(*) from public.audit_log where id > ${sejak} and action = 'certificate.revoked' and target_id = '${sertifikat}' and summary->>'reason' = '${esc(alasan)}'`) === "1",
    "certificate.revoked is audited with the reason");
  harus(rec, sql(`select validity from public.verify_certificate('${token}')`) === "DICABUT", "the public check says DICABUT");
  await buka(S, `/konfigurasi/sertifikat?cari=${encodeURIComponent(nomor)}`);
  harus(rec, /Dicabut/.test(norm(await S.locator("#pin-sertifikat").textContent())), "the list says «Dicabut»");
  await aksesibel(rec, S, "/konfigurasi/sertifikat");
});

// ── B5-W2 integrity review
await step("B5-W2", "W2.7: one decision per observation; the referrer sees the case's steps and outcome on Tinjauan Integritas", async (rec) => {
  if (!harus(rec, sinyal.length === 2, "two observations of an alpha sitting are waiting")) return;
  const [s1, s2] = sinyal;
  await buka(A, "/studio/integritas");
  const kartu = A.locator(`[data-sesi-integritas="${sesiId}"]`);
  await kartu.waitFor({ timeout: SLOW });
  const teks = norm(await kartu.textContent());
  harus(rec, teks.includes(namaMuridSesi) && /Menunggu tinjauan/.test(teks), `the sitting is named «${namaMuridSesi}», «Menunggu tinjauan»`);
  const sendiri = await Promise.all(sinyal.map((x) => kartu.locator(`form:has(input[name="sinyal"][value="${x}"])`).count()));
  harus(rec, sendiri.every((n) => n === 1), "each observation has its own form");
  await shot(A, rec, "integritas-menunggu");
  // one: nothing to follow up
  const f1 = A.locator("form").filter({ has: A.locator(`input[name="sinyal"][value="${s1}"]`) });
  await f1.locator('select[name="keputusan"]').selectOption("NO_CONCERN");
  await f1.getByRole("button", { name: "Catat tinjauan" }).click();
  await A.getByText("Tinjauan Anda dicatat.").first().waitFor({ timeout: SLOW });
  await buka(A, "/studio/integritas");
  harus(rec, (await A.locator(`input[name="sinyal"][value="${s1}"]`).count()) === 0 && (await A.locator(`input[name="sinyal"][value="${s2}"]`).count()) === 1,
    "the decided observation left; the other still waits");
  // the other: referred, with a note
  const CATATAN = `Pindah layar berulang (uji ${TAG})`;
  const f2 = A.locator("form").filter({ has: A.locator(`input[name="sinyal"][value="${s2}"]`) });
  await f2.locator('select[name="keputusan"]').selectOption("REFERRED_TO_INSTITUTION");
  await f2.locator('input[name="catatan"]').fill(CATATAN);
  await f2.getByRole("button", { name: "Catat tinjauan" }).click();
  await A.getByText("Tinjauan Anda dicatat.").first().waitFor({ timeout: SLOW });
  const kasus = sql(`select id from public.management_decisions where source_id = '${s2}' and family = 'INTEGRITY_REFERRAL'`);
  harus(rec, Boolean(kasus), "the referral is a case in the decision queue");
  await buka(A, `/studio/integritas?muat=${Date.now()}#ditinjau`);
  const menunggu = norm(await A.locator(`[data-sinyal-ditinjau="${s2}"]`).textContent());
  harus(rec, /Diteruskan ke pihak sekolah/.test(menunggu) && /Ditinjau pimpinan/.test(menunggu) && menunggu.includes(CATATAN),
    `the referrer reads the referral and its steps: «${menunggu.slice(0, 200)}»`);
  await shot(A, rec, "integritas-diteruskan");
  // the dean decides it on /pimpinan
  await buka(D, "/pimpinan");
  const kartuD = D.locator("article.pin-kp").filter({ has: D.locator("blockquote.pin-kp-catatan", { hasText: CATATAN }) }).first();
  if (!harus(rec, (await kartuD.count()) === 1, "alpha's dean has the case under «Keputusan»")) { await shot(D, rec, "pimpinan-tanpa-kartu"); return; }
  await kartuD.getByRole("button", { name: "Saya yang menangani", exact: true }).click();
  for (let i = 0; i < 40 && sql(`select state from public.management_decisions where id = '${kasus}'`) !== "UNDER_REVIEW"; i++) await D.waitForTimeout(500);
  await D.waitForLoadState("networkidle");
  const k2 = D.locator("article.pin-kp").filter({ has: D.locator("blockquote.pin-kp-catatan", { hasText: CATATAN }) }).first();
  const PUTUS = `Sudah dibicarakan dengan wali kelas (uji ${TAG})`;
  await k2.locator('select[name="hasil"]').selectOption({ label: "Pendampingan disiapkan" });
  await k2.locator('textarea[name="catatan"]').fill(PUTUS);
  await k2.getByRole("button", { name: "Catat keputusan", exact: true }).click();
  for (let i = 0; i < 40 && sql(`select state from public.management_decisions where id = '${kasus}'`) !== "DECIDED"; i++) await D.waitForTimeout(500);
  harus(rec, sql(`select state || '|' || outcome from public.management_decisions where id = '${kasus}'`) === "DECIDED|LEARNER_SUPPORT_ARRANGED", "the dean's decision is recorded");
  // the referrer reads the outcome where she referred it
  await buka(A, `/studio/integritas?muat=${Date.now()}#ditinjau`);
  const hasil = norm(await A.locator(`[data-sinyal-ditinjau="${s2}"]`).textContent());
  harus(rec, /Diputuskan/.test(hasil) && /Keputusan: Pendampingan disiapkan/.test(hasil) && hasil.includes(PUTUS) && /Pendampingan untuk murid disiapkan/.test(hasil),
    `the referrer reads «Diputuskan», the outcome, the dean's note and the next step: «${hasil.slice(0, 260)}»`);
  harus(rec, !/[0-9a-f]{8}-[0-9a-f]{4}-/.test(hasil) && !/REFERRED_TO_INSTITUTION|LEARNER_SUPPORT_ARRANGED|DECIDED/.test(hasil), "no identifier or raw code on the screen");
  await shot(A, rec, "integritas-diputuskan");
  await aksesibel(rec, A, "/studio/integritas");
});

// ── B5-W3 the waiting list, paged
await step("B5-W3", "W2.10: Aktivasi lists the people waiting for an account 20 to a page, with the count, the next page and a search", async (rec) => {
  await buka(A, "/aktivasi");
  const n1 = await A.locator("li.pin-akt-orang").count();
  const jumlah = Number(await A.locator("[data-jumlah-tunggu]").getAttribute("data-jumlah-tunggu"));
  harus(rec, n1 <= 20 && jumlah >= 25, `page 1 draws ${n1} people (≤ 20) of ${jumlah} waiting (≥ 25)`);
  await shot(A, rec, "aktivasi-halaman-1");
  await A.locator("[data-penomoran] a", { hasText: "Berikutnya" }).first().click();
  await A.waitForURL((u) => u.searchParams.get("hal_tunggu") === "2", { timeout: SLOW });
  await A.waitForLoadState("networkidle");
  harus(rec, (await A.locator("li.pin-akt-orang").count()) >= 1, "page 2 draws the rest");
  await buka(A, `/aktivasi`);
  await A.locator('[data-cari-tunggu] input[type="search"]').fill(NAMA_TUNGGU(23));
  await A.waitForURL((u) => u.searchParams.get("cari_tunggu") === NAMA_TUNGGU(23), { timeout: SLOW });
  await A.waitForLoadState("networkidle");
  await A.waitForFunction((n) => [...document.querySelectorAll("li.pin-akt-orang")].length === 1 && document.body.textContent.includes(n), NAMA_TUNGGU(23), { timeout: SLOW }).catch(() => {});
  const satu = await A.locator("li.pin-akt-orang").count();
  harus(rec, satu === 1 && (await A.locator("li.pin-akt-orang").first().textContent()).includes(NAMA_TUNGGU(23)), `searching finds exactly «${NAMA_TUNGGU(23)}» (${satu} row(s))`);
  await shot(A, rec, "aktivasi-cari");
  await aksesibel(rec, A, "/aktivasi");
});

// ── B5-W4 the class report
await step("B5-W4", "W3.8: alpha's dean opens the class report in the staff shell, named by school, class and year; print drops the navigation", async (rec) => {
  const kelas = sql(`select n.id || '|' || n.name || '|' || coalesce(ap.name, '') || '|' || i.name from public.org_nodes n join public.institutions i on i.id = n.institution_id
     left join public.academic_periods ap on ap.id = n.academic_period_id where n.institution_id = '${alphaId}' and n.kind = 'CLASS' order by n.created_at limit 1`);
  const [idKelas, namaKelas, tahun, namaSekolah] = kelas.split("|");
  await buka(D, `/edukator/ringkasan?kelas=${idKelas}`);
  const teks = norm(await D.locator("body").textContent());
  harus(rec, (await D.locator("header.pin-shell, .pin-shell").count()) > 0, "the report is inside the staff shell");
  harus(rec, teks.includes(namaSekolah) && teks.includes(namaKelas) && (!tahun || teks.includes(tahun)), `the report names «${namaSekolah}», «${namaKelas}»${tahun ? ` and «${tahun}»` : ""}`);
  await shot(D, rec, "laporan-kelas");
  await D.emulateMedia({ media: "print" });
  const navTerlihat = await D.evaluate(() => [...document.querySelectorAll("nav, header")].filter((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none").length);
  harus(rec, navTerlihat === 0, `in print no navigation or header shows (${navTerlihat})`);
  await shot(D, rec, "laporan-kelas-cetak");
  await D.emulateMedia({ media: "screen" });
  await aksesibel(rec, D, "/edukator/ringkasan");
});

// ── B5-W5 the teacher
await step("B5-W5", "W2.18 / UX-37: the Guru's view of one learner lists the objectives not yet reached; /mengajar's running rows open", async (rec) => {
  // a class of alpha's with an active learner, one the Guru's own Mengajar home lists
  await buka(G, "/mengajar");
  const tautan = await G.locator('a[href^="/mengajar/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  const k = (tautan.map((h) => /^\/mengajar\/([0-9a-f-]{36})(?:$|[/?])/.exec(h ?? "")?.[1]).find(Boolean)) ?? "";
  const murid = k ? sql(`select e.person_id from public.memberships m join public.enrollments e on e.id = m.enrollment_id
     where m.node_id = '${k}' and m.valid_to is null and e.status = 'ACTIVE' limit 1`) : "";
  if (!harus(rec, Boolean(k && murid), `the Guru teaches a class with a learner (on ${new URL(G.url()).pathname}: ${JSON.stringify(tautan.slice(0, 6))})`)) {
    await shot(G, rec, "guru-tanpa-kelas");
    return;
  }
  await buka(G, `/mengajar/${k}/murid/${murid}`);
  const teks = norm(await G.locator("main").textContent());
  harus(rec, /Tujuan pembelajaran yang belum tercapai/.test(teks), "the learner page has «Tujuan pembelajaran yang belum tercapai»");
  harus(rec, !/[0-9a-f]{8}-[0-9a-f]{4}-/.test(teks), "no identifier on the screen");
  await shot(G, rec, "guru-murid");
  await aksesibel(rec, G, "/mengajar/[kelas]/murid/[orang]");
  await buka(G, "/mengajar");
  await shot(G, rec, "mengajar-beranda");
  const berjalan = await G.locator('a[href*="/siapa?penugasan="]').count();
  harus(rec, true, `/mengajar shows ${berjalan} running row link(s)`);
  await aksesibel(rec, G, "/mengajar");
});

// ── B5-W6 the learner
await step("B5-W6", "W3.10 / W3.15: Belajar fits 640 and 320 px; the tour leaves the page usable", async (rec) => {
  await M.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  const dialog = M.locator('[role="dialog"]');
  if (await dialog.count()) {
    harus(rec, (await dialog.first().getAttribute("aria-modal")) !== "true", "the tour is not aria-modal");
    harus(rec, await M.evaluate(() => !document.querySelector("main[inert], #isi[inert]")), "the page behind the tour is not inert");
  } else harus(rec, true, "no tour shown on this visit");
  for (const w of [640, 320]) {
    await M.setViewportSize({ width: w, height: 900 });
    await M.waitForTimeout(200);
    const lebar = await M.evaluate(() => document.documentElement.scrollWidth);
    harus(rec, lebar <= w, `Belajar at ${w} px is ${lebar} px wide`);
    await shot(M, rec, `belajar-${w}`);
  }
  await M.setViewportSize({ width: 1280, height: 900 });
  const lewati = M.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  await aksesibel(rec, M, "/belajar");
});

await browser.close();
writeFileSync(join(OUT, "b5-ujung.json"), JSON.stringify({ app: APP, tag: TAG, langkah, a11y: a11ySemua }, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);

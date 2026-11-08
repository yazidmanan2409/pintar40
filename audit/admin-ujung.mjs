// BATCH 4 EXIT GATE (D-152): «every administration action done through screens in a browser walk, with no SQL; audit
// rows asserted». Each act below is done by a person at a screen, by clicking and typing; SQL is used only to prepare
// a fixture the way the intake would (one learner recorded with a PINTAR ID) and to READ what the database recorded
// afterwards (the audit rows, the account, the enrolments), never to act.
//
//   B4-W1  the platform admin, in «Seluruh platform», corrects a Guru's name on «Koreksi data orang» (reason required):
//          identity.name_corrected with the reason
//   B4-W2  … and the Guru's username: identity.username_corrected
//   B4-W3  … and a not-yet-activated person's email: identity.email_corrected, the new address on the Auth user
//   B4-W4  the school admin makes a class card on Aktivasi for a learner recorded by the intake: account.activation_*
//   B4-W5  the platform admin turns that card into an email account («Murid yang menjadi staf», reason required):
//          account.card_converted_to_email; the same account row is EMAIL, set-up REQUIRED
//   B4-W6  alpha's admin finds beta by its exact name and requests a learner's transfer (reason): transfer.requested
//          and directory.school_searched
//   B4-W7  beta's admin accepts it into beta's school year, then executes it: transfer.authorized, transfer.executed;
//          the learner is enrolled at beta and the alpha enrolment ENDED
//   B4-W8  alpha's admin sees «Yang menunggu» on Konfigurasi with a count that opens Aktivasi
//   B4-W9  the platform admin sees the stuck sends on «Email uji» and the schools paged on Konfigurasi
//   B4-W10 a staff member adds a profile photo on «Akun saya» and removes it (persons.photo_path set, then cleared)
//   B4-W11 alpha's admin schedules a maintenance window in two steps, opens it in place and cancels it (B1 §1)
//
// Local or CI stack with the synthetic seed: APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_DB_URL. Writes OUT_DIR/admin-ujung.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/admin-ujung";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const ORANG = {
  sys: { key: "sys", tujuan: "MENGELOLA:PLATFORM", email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" },
  alpha: { key: "alpha", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  beta: { key: "beta", tujuan: "MENGELOLA", email: "beta-admin@synthetic.pintar.test", password: "Sintetis-BetaAdmin-61!" },
};
const TAG = randomBytes(3).toString("hex");

mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const esc = (s) => s.replace(/'/g, "''");
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const jejakSejak = () => Number(sql("select coalesce(max(id), 0) from public.audit_log"));
const jejak = (sejak, aksi, target) => sql(`select count(*) from public.audit_log where id > ${sejak} and action = '${esc(aksi)}'`
  + (target ? ` and target_id = '${esc(target)}'` : ""));

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

// the fixture, as the intake records a learner: a person with alpha's PINTAR ID, nothing else
const alphaId = sql("select id from public.institutions where slug like 'synth-alpha-%' limit 1");
const betaNama = sql("select name from public.institutions where slug like 'synth-beta-%' limit 1");
const MURID_KARTU = `Murid Walk ${TAG}`;
let muridKartu = "";
const catatMurid = (nama) => sql(`do $$ declare v uuid; begin
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.persons (display_name) values ('${esc(nama)}') returning id into v;
    perform public.issue_institutional_id(v, '${alphaId}');
  end $$; select id from public.persons where display_name = '${esc(nama)}'`).split("\n").pop();
// a person with an email account not yet activated, for the email correction (the seed's activated staff are not)
const BELUM = `Staf Walk ${TAG}`;

const browser = await chromium.launch();
const sesi = {};
for (const [k, p] of Object.entries(ORANG)) sesi[k] = await masuk(browser, p);
const S = sesi.sys.page, A = sesi.alpha.page, B = sesi.beta.page;

// ── B4-W0: the school's code, set on Pendataan (Daisy's TextField, W3.7), so the school can issue PINTAR IDs
await step("B4-W0", "alpha's admin gives the school its code on Pendataan (the TextField, its hint under the label)", async (rec) => {
  const ada = sql(`select coalesce(namespace, '') from public.institutions where id = '${alphaId}'`);
  if (ada) { harus(rec, true, `alpha already has its code (${ada})`); return; }
  const kode = sql(`select x from (select chr(65 + (g % 26)) || chr(65 + ((g / 26) % 26)) || 'W' as x from generate_series(1, 600) g) q
                     where not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1`);
  await buka(A, "/pendataan");
  await A.locator("#pin-kode-isi").fill(kode);
  harus(rec, (await A.locator("#pin-kode-isi").getAttribute("aria-describedby")) === "pin-kode-isi-petunjuk", "the hint is named by the field");
  await A.getByRole("button", { name: /Simpan/ }).first().click();
  await A.waitForLoadState("networkidle");
  await shot(A, rec, "kode-sekolah");
  harus(rec, sql(`select coalesce(namespace, '') from public.institutions where id = '${alphaId}'`) === kode, `alpha's code is ${kode}`);
});
muridKartu = catatMurid(MURID_KARTU);

// ── B4-W1..W3: «Koreksi data orang»
const guruId = sql("select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = 'alpha-guru@synthetic.pintar.test'");
async function bukaKoreksi(cari, orang) {
  await buka(S, `/aktivasi/orang?cari=${encodeURIComponent(cari)}`);
  await S.locator(`a[data-koreksi-orang="${orang}"]`).first().click();
  await S.locator("#koreksi").waitFor({ timeout: SLOW });
}
await step("B4-W1", "the platform admin corrects a Guru's name on «Koreksi data orang», with a reason, and it is audited", async (rec) => {
  const sejak = jejakSejak();
  await bukaKoreksi("alpha-guru@synthetic.pintar.test", guruId);
  const f = S.locator('form[data-koreksi="nama"]');
  await f.locator("#koreksi-nama").fill(`Guru Alpha Walk ${TAG}`);
  await f.locator("#koreksi-nama-alasan").fill("Ejaan nama salah saat pendataan");
  await f.locator('button[type="submit"]').click();
  await S.getByText("Nama dikoreksi dan dicatat.").waitFor({ timeout: SLOW });
  await shot(S, rec, "koreksi-nama");
  harus(rec, sql(`select display_name from public.persons where id = '${guruId}'`) === `Guru Alpha Walk ${TAG}`, "the person's name is the corrected one");
  harus(rec, jejak(sejak, "identity.name_corrected", guruId) === "1", "identity.name_corrected is in the audit log for the Guru");
  harus(rec, sql(`select summary->>'reason' from public.audit_log where id > ${sejak} and action = 'identity.name_corrected'`) === "Ejaan nama salah saat pendataan",
    "the audit row carries the reason");
});
await step("B4-W2", "the platform admin corrects the Guru's username, and it is audited", async (rec) => {
  const sejak = jejakSejak();
  await bukaKoreksi("alpha-guru@synthetic.pintar.test", guruId);
  const f = S.locator('form[data-koreksi="username"]');
  await f.locator("#koreksi-username").fill(`guru.walk.${TAG}`);
  await f.locator("#koreksi-username-alasan").fill("Username lama memuat nama yang salah");
  await f.locator('button[type="submit"]').click();
  await S.getByText("Username dikoreksi dan dicatat.").waitFor({ timeout: SLOW });
  await shot(S, rec, "koreksi-username");
  harus(rec, sql(`select username from public.person_usernames where person_id = '${guruId}'`) === `guru.walk.${TAG}`, "the username is the corrected one");
  harus(rec, jejak(sejak, "identity.username_corrected", guruId) === "1", "identity.username_corrected is in the audit log");
});

// ── B4-W4: a class card for the intake's learner, on Aktivasi (alpha's admin)
let kartuAkun = "";
await step("B4-W4", "alpha's admin makes a class card on Aktivasi for a learner the intake recorded, and it is audited", async (rec) => {
  const sejak = jejakSejak();
  await buka(A, "/aktivasi");
  const baris = A.locator("li.pin-akt-orang", { hasText: MURID_KARTU }).first();
  await baris.waitFor({ timeout: SLOW });
  await baris.getByRole("button", { name: "Buat kartu kelas" }).click();
  await A.waitForFunction((n) => !!document.querySelector("li.pin-akt-orang") && [...document.querySelectorAll("li.pin-akt-orang")]
    .some((li) => li.textContent.includes(n) && /\d{10}/.test(li.textContent)), MURID_KARTU, { timeout: SLOW }).catch(() => {});
  kartuAkun = sql(`select id || '/' || kind from public.accounts where person_id = '${muridKartu}'`);
  harus(rec, kartuAkun.endsWith("/CLASSROOM_CARD"), `the learner has a class-card account (${kartuAkun || "none"})`);
  harus(rec, Number(sql(`select count(*) from public.audit_log where id > ${sejak} and action like 'account.%' and target_id = '${muridKartu}'`)) >= 1,
    "the card's making is audited");
});

// ── B4-W5: the card becomes an email account (the platform admin, «Murid yang menjadi staf»)
const EMAIL_STAF = `walk-staf-${TAG}@local.invalid`;
await step("B4-W5", "the platform admin turns the learner's class card into an email account on Aktivasi, with a reason, and it is audited", async (rec) => {
  const sejak = jejakSejak();
  // CROSS-BATCH (6 Nov): the person's learning history and school standing, before the conversion, to be kept by it
  const riwayat = () => sql(`select md5(coalesce((select string_agg(e.id::text || ':' || e.status::text, ',' order by e.id) from public.enrollments e where e.person_id = '${muridKartu}'), '')
    || '|' || coalesce((select string_agg(m.id::text, ',' order by m.id) from public.memberships m join public.enrollments e on e.id = m.enrollment_id where e.person_id = '${muridKartu}' and m.valid_to is null), '')
    || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.assessment_sessions x where x.person_id = '${muridKartu}'), '')
    || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.official_results x where x.person_id = '${muridKartu}'), '')
    || '|' || coalesce((select string_agg(x.id::text || ':' || x.status::text, ',' order by x.id) from public.certificates x where x.person_id = '${muridKartu}'), '')
    || '|' || coalesce((select p.pintar_id from public.persons p where p.id = '${muridKartu}'), ''))`);
  const riwayatSebelum = riwayat();
  await buka(S, `/aktivasi?cari_staf=${encodeURIComponent(MURID_KARTU)}`);
  const bagian = S.locator("#jadi-staf");
  const baris = bagian.locator(`li[data-orang="${muridKartu}"]`);
  await baris.waitFor({ timeout: SLOW });
  await baris.getByRole("button", { name: "Ubah menjadi akun email" }).click();
  await baris.locator(`#staf-email-${muridKartu}`).fill(EMAIL_STAF);
  await baris.locator(`#staf-alasan-${muridKartu}`).fill("Diangkat menjadi asisten guru");
  await baris.getByRole("button", { name: "Ya, ubah menjadi akun email" }).click();
  await bagian.locator(".pin-hasil-ok").waitFor({ timeout: SLOW });
  await shot(S, rec, "kartu-jadi-email");
  const sesudah = sql(`select id || '/' || kind from public.accounts where person_id = '${muridKartu}'`);
  harus(rec, sesudah === kartuAkun.replace("/CLASSROOM_CARD", "/EMAIL"), `the same account row is now EMAIL (${sesudah})`);
  harus(rec, sql(`select lower(u.email) from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = '${muridKartu}'`) === EMAIL_STAF,
    "the Auth user carries the new address");
  harus(rec, jejak(sejak, "account.card_converted_to_email", muridKartu) === "1", "account.card_converted_to_email is in the audit log");
  harus(rec, riwayat() === riwayatSebelum, "the conversion keeps the person's enrolments, open class placement, sittings, official results, certificates and PINTAR ID");
});

// ── B4-W3: the converted person (not yet activated) has the wrong address: the email correction
await step("B4-W3", "the platform admin corrects the not-yet-activated person's email on «Koreksi data orang», and it is audited", async (rec) => {
  const sejak = jejakSejak();
  const baru = `walk-benar-${TAG}@local.invalid`;
  await bukaKoreksi(MURID_KARTU, muridKartu);
  await S.locator("#koreksi-email").fill(baru);
  await S.locator("#koreksi-email-alasan").fill("Alamat tertukar dengan rekan");
  await S.getByRole("button", { name: "Koreksi email" }).click();
  await S.getByText(/Email dikoreksi\./).first().waitFor({ timeout: SLOW });
  await shot(S, rec, "koreksi-email");
  harus(rec, sql(`select lower(u.email) from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = '${muridKartu}'`) === baru,
    "the Auth user carries the corrected address");
  harus(rec, jejak(sejak, "identity.email_corrected", muridKartu) === "1", "identity.email_corrected is in the audit log");
});

// ── B4-W6, W7: a transfer by name, accepted and executed by the receiving school
const siswa = sql("select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = 'alpha-siswa-1@synthetic.pintar.test'");
const siswaNama = sql(`select display_name from public.persons where id = '${siswa}'`);
let transfer = "";
await step("B4-W6", "alpha's admin finds beta by its exact name and asks for a learner's transfer, with a reason; both are audited", async (rec) => {
  const sejak = jejakSejak();
  await buka(A, `/konfigurasi/transfers?bagian=transfers&cari_sekolah=${encodeURIComponent(betaNama)}#transfers`);
  const keluar = A.locator('[data-pindah="keluar"]');
  await keluar.waitFor({ timeout: SLOW });
  harus(rec, (await keluar.locator('input[name="to_institution"]').count()) === 1, `the directory finds exactly one school for «${betaNama}»`);
  const pilihan = await keluar.locator('select[name="from_enrollment"] option').evaluateAll((os) => os.map((o) => [o.value, o.textContent]));
  const nilai = pilihan.find(([, t]) => (t ?? "").includes(siswaNama))?.[0];
  if (!harus(rec, !!nilai, `the learner «${siswaNama}» is offered`)) return;
  await keluar.locator('select[name="from_enrollment"]').selectOption(nilai);
  await keluar.locator('input[name="reason"]').fill("Pindah domisili mengikuti orang tua");
  await keluar.getByRole("button", { name: /Ajukan|Minta|perpindahan/i }).last().click();
  await A.waitForLoadState("networkidle");
  // the request is a server action: wait for its row rather than for the network to go quiet
  const cariTransfer = () => sql(`select coalesce((select id::text from public.transfers where person_id = '${siswa}' order by created_at desc limit 1), '')`);
  for (let i = 0; i < 40 && !cariTransfer(); i++) await A.waitForTimeout(500);
  await A.waitForLoadState("networkidle");
  await shot(A, rec, "pindah-minta");
  transfer = cariTransfer();
  if (!harus(rec, !!transfer, "the request is saved")) return;
  harus(rec, sql(`select status from public.transfers where id = '${transfer}'`) === "REQUESTED", "the transfer is REQUESTED, with no school year yet");
  harus(rec, Number(jejak(sejak, "directory.school_searched")) >= 1, "the search is audited (directory.school_searched)");
  harus(rec, Number(jejak(sejak, "transfer.requested", transfer)) >= 1, "the request is audited (transfer.requested)");
});
await step("B4-W7", "beta's admin accepts the request into beta's school year and executes it; the enrolments move and both acts are audited", async (rec) => {
  if (!transfer) { rec.verdict = "BLOCKED"; rec.catatan.push("no transfer from B4-W6"); gagal = true; return; }
  const sejak = jejakSejak();
  await buka(B, "/konfigurasi/transfers?bagian=transfers#transfers");
  const masuk = B.locator(`form[data-pindah-masuk="${transfer}"]`);
  await masuk.waitFor({ timeout: SLOW });
  harus(rec, norm(await masuk.innerText()).includes(siswaNama), "the request shows the learner's name");
  const tahun = await masuk.locator('select[name="to_period"] option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  await masuk.locator('select[name="to_period"]').selectOption(tahun[0]);
  // the class the learner arrives in (20261231100000): the first Kelas beta offers
  const tempat = await masuk.locator('select[name="to_place"] option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  if (!harus(rec, tempat.length >= 1, "the acceptance offers beta's Kelas for the learner")) return;
  await masuk.locator('select[name="to_place"]').selectOption(tempat[0]);
  await masuk.getByRole("button", { name: "Terima perpindahan" }).click();
  await B.waitForURL((u) => u.searchParams.has("hasil") || u.searchParams.has("kode") || u.hash === "#transfers", { timeout: SLOW }).catch(() => {});
  await B.waitForLoadState("networkidle");
  for (let i = 0; i < 20 && sql(`select status from public.transfers where id = '${transfer}'`) === "REQUESTED"; i++) await B.waitForTimeout(500);
  harus(rec, sql(`select status from public.transfers where id = '${transfer}'`) === "AUTHORIZED", "accepted: the transfer is AUTHORIZED into beta's year");
  await buka(B, "/konfigurasi/transfers?bagian=transfers#transfers");
  const baris = B.locator("#transfers li", { hasText: siswaNama }).first();
  await baris.getByRole("button", { name: "Laksanakan" }).click();
  await B.waitForLoadState("networkidle");
  for (let i = 0; i < 20 && sql(`select status from public.transfers where id = '${transfer}'`) === "AUTHORIZED"; i++) await B.waitForTimeout(500);
  await shot(B, rec, "pindah-laksana");
  harus(rec, sql(`select status from public.transfers where id = '${transfer}'`) === "EXECUTED", "the transfer is EXECUTED");
  const beta = sql("select id from public.institutions where slug like 'synth-beta-%' limit 1");
  harus(rec, sql(`select count(*) from public.enrollments where person_id = '${siswa}' and institution_id = '${beta}' and status = 'ACTIVE'`) === "1", "the learner is enrolled at beta");
  harus(rec, sql(`select count(*) from public.enrollments where person_id = '${siswa}' and institution_id = '${alphaId}' and status = 'ACTIVE'`) === "0", "the alpha enrolment is no longer active");
  // CROSS-BATCH (6 Nov): the learner arrives IN A CLASS: one open placement, the chosen Kelas; and beta's admin finds
  // them on «Pindah kelas» for that Kelas, the screen that reads placements (before 20261231100000 it read nobody)
  harus(rec, sql(`select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
     where e.person_id = '${siswa}' and m.valid_to is null`) === "1"
    && sql(`select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
     where e.person_id = '${siswa}' and e.institution_id = '${beta}' and m.node_id = '${tempat[0]}' and m.valid_to is null`) === "1",
    "the learner has one open placement, in the Kelas beta named");
  await buka(B, `/konfigurasi/pindah?bagian=pindah&dari=${tempat[0]}#pindah`);
  await B.locator("#pindah").waitFor({ timeout: SLOW });
  harus(rec, norm(await B.locator("#pindah").innerText()).includes(siswaNama), "beta's admin sees the learner in that Kelas on «Pindah kelas»");
  await shot(B, rec, "pindah-tiba-di-kelas");
  harus(rec, Number(jejak(sejak, "transfer.authorized", transfer)) >= 1 && Number(jejak(sejak, "transfer.executed", transfer)) >= 1,
    "the acceptance and the execution are audited (transfer.authorized, transfer.executed)");
});

// ── B4-W7b (cross-batch, 6 Nov): the transferred learner signs in afterwards. Their learning page opens; what it offers
//    is what their open placement at beta entitles (my_learning_assignments reads enrolment + open placement); nothing
//    released to the alpha class they left is offered, and the session holds no school context of alpha's.
await step("B4-W7b", "the transferred learner signs in afterwards: the learning page opens and offers nothing of the alpha class they left", async (rec) => {
  if (!transfer || sql(`select status from public.transfers where id = '${transfer}'`) !== "EXECUTED") {
    rec.verdict = "BLOCKED"; rec.catatan.push("no executed transfer from B4-W7"); gagal = true; return;
  }
  const kelasLama = sql(`select string_agg(distinct m.node_id::text, ',') from public.memberships m join public.enrollments e on e.id = m.enrollment_id
     where e.person_id = '${siswa}' and e.institution_id = '${alphaId}' and m.close_reason = 'ENROLLMENT_ENDED'`);
  const judulLama = kelasLama ? sql(`select coalesce(string_agg(distinct c.title, '\n'), '') from public.learning_assignments la
     join public.courses c on c.id = la.course_id where la.node_id = any (string_to_array('${kelasLama}', ',')::uuid[])
       and la.status = 'ACTIVE'`).split("\n").filter(Boolean) : [];
  const m = await masuk(browser, { key: "siswa", tujuan: "BELAJAR", email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" });
  try {
    await buka(m.page, "/belajar");
    harus(rec, new URL(m.page.url()).pathname === "/belajar" && (await m.page.locator("main h1").count()) >= 1, `the learning page opens (${new URL(m.page.url()).pathname})`);
    const isi = norm(await m.page.locator("main").innerText());
    await shot(m.page, rec, "pindah-murid-belajar");
    const bocor = judulLama.filter((j) => isi.includes(j));
    harus(rec, bocor.length === 0, `nothing released to the alpha class they left is offered (${judulLama.length} title(s) checked${bocor.length ? `; shown: ${bocor.join(", ")}` : ""})`);
  } finally { await m.context.close(); }
});

// ── B4-W8: what waits, on alpha's Konfigurasi
await step("B4-W8", "alpha's admin sees «Yang menunggu» on Konfigurasi with a count that opens Aktivasi", async (rec) => {
  catatMurid(BELUM);
  await buka(A, "/konfigurasi");
  const blok = A.locator("[data-menunggu]");
  await blok.waitFor({ timeout: SLOW });
  await shot(A, rec, "menunggu");
  const akun = blok.locator('[data-menunggu-jenis="akun"] a');
  harus(rec, (await akun.count()) === 1 && Number(norm(await akun.locator(".pin-num").innerText())) >= 1, "a count of people waiting for an account is shown");
  // D-195(2), CONTOH LAPORAN 7-admin: under the count, each reason with its remedy, and the reasons add up to it
  const total = Number(norm(await akun.locator(".pin-num").innerText()));
  const alasan = await blok.locator('[data-menunggu-jenis="akun"] [data-alasan]').evaluateAll((li) => li.map((x) => ({ k: x.getAttribute("data-alasan"), n: Number((x.querySelector(".pin-num")?.textContent ?? "").replace(/\D/g, "")) })));
  harus(rec, alasan.length >= 1 && alasan.every((x) => x.k === "kartu" || x.k === "email") && alasan.reduce((a, x) => a + x.n, 0) === total,
    `the reasons under the count add up to it (${total}: ${alasan.map((x) => `${x.k} ${x.n}`).join(", ") || "none"})`);
  await akun.click();
  await A.waitForURL((u) => u.pathname === "/aktivasi", { timeout: SLOW });
  harus(rec, true, "the count opens Aktivasi");
});

// ── B4-W9: stuck sends and the paged schools (the platform admin)
await step("B4-W9", "the platform admin sees a stuck send on «Email uji» and the schools a page at a time on Konfigurasi", async (rec) => {
  sql(`insert into public.email_send_log (requested_at, kind, recipient_hash, outcome) values (now() - interval '40 minutes', 'KODE_AKTIVASI', repeat('d', 64), 'PENDING')`);
  await buka(S, "/konfigurasi/email-uji");
  const teks = norm(await S.locator("main").innerText());
  await shot(S, rec, "email-tertahan");
  harus(rec, /Belum dijawab selama\s*\d+/.test(teks), "the stuck send is listed with how long it has waited");
  await buka(S, "/konfigurasi/system#system");
  const sekolah = await S.locator("#system li").count();
  harus(rec, sekolah >= 1 && sekolah <= 21, `the system section lists ${sekolah} school row(s), at most a page`);
});

// ── B4-W10: a profile photo on «Akun saya»
await step("B4-W10", "a staff member adds a profile photo on «Akun saya», sees it, and removes it", async (rec) => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const berkas = join(OUT, "foto.png");
  writeFileSync(berkas, png);
  const aku = sql("select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = 'alpha-admin@synthetic.pintar.test'");
  await buka(A, "/akun#foto");
  await A.locator("#foto-profil").setInputFiles(berkas);
  await A.getByText("Foto profil disimpan.").waitFor({ timeout: SLOW });
  await A.waitForLoadState("networkidle");
  const jalur = sql(`select coalesce(photo_path, '') from public.persons where id = '${aku}'`);
  harus(rec, jalur.startsWith(`profile/${aku}/`), `the photo is kept in the person's own folder (${jalur})`);
  await buka(A, "/akun#foto");
  const img = A.locator("img[data-foto-profil]");
  const muat = await A.waitForFunction(() => { const i = document.querySelector("img[data-foto-profil]"); return !!i && i.complete && i.naturalWidth > 0; },
    null, { timeout: 15000 }).then(() => true, () => false);
  const rinci = (await img.count()) ? await img.evaluate((i) => `${i.getAttribute("src")} complete=${i.complete} w=${i.naturalWidth}`) : "no img";
  harus(rec, muat, `the photo shows on «Akun saya» (${rinci})`);
  await shot(A, rec, "foto");
  await A.getByRole("button", { name: "Hapus foto" }).click();
  await A.getByText("Foto profil dihapus dari profil Anda.").waitFor({ timeout: SLOW });
  harus(rec, sql(`select coalesce(photo_path, '') from public.persons where id = '${aku}'`) === "", "removed: the person has no photo");
});

// ── B4-W11: Pemeliharaan, composed (B1 §1): the two-step schedule, then the window as a record opened in place
await step("B4-W11", "alpha's admin checks a time, schedules a window in step 2, opens it in place by its named action and cancels it with a reason; both acts are audited", async (rec) => {
  const sejak = jejakSejak();
  const alasan = `Pembaruan walk ${TAG}`;
  await buka(A, "/konfigurasi/pemeliharaan");
  harus(rec, (await A.locator('form input[name="asal"][value="jadwal"]').count()) === 0, "step 1 draws no schedule form");
  const jadwal = A.locator('section[aria-labelledby="pin-pm-jadwal"]');
  await jadwal.locator(`input[name="pm_sekolah"][value="${alphaId}"]`).check();
  await jadwal.locator("#cfg-pm-mulai").fill("2031-03-01T19:00");
  await jadwal.locator("#cfg-pm-selesai").fill("2031-03-01T21:00");
  await jadwal.getByRole("button", { name: "Periksa waktu ini" }).click();
  await A.waitForURL((u) => u.searchParams.get("pm_cek") === "1", { timeout: SLOW });
  await A.waitForLoadState("networkidle");
  const langkah2 = A.locator('[data-tabrakan="1"]');
  await langkah2.waitFor({ timeout: SLOW });
  const kabar = langkah2.locator('[role="status"]');
  harus(rec, (await kabar.count()) >= 1 && norm(await kabar.first().innerText()).length > 0,
    `step 2 says what the window would meet before anything is saved («${norm(await kabar.first().innerText().catch(() => ""))}», ${await kabar.count()} line(s))`);
  await langkah2.locator('input[name="alasan"]').fill(alasan);
  await langkah2.getByRole("button", { name: "Jadwalkan pemeliharaan" }).click();
  await A.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await A.waitForLoadState("networkidle");
  const jendela = sql(`select id from public.maintenance_windows where reason = '${esc(alasan)}' order by created_at desc limit 1`);
  if (!harus(rec, !!jendela, "the window is saved")) return;
  harus(rec, Number(jejak(sejak, "maintenance.scheduled", jendela)) >= 1, "scheduling is audited (maintenance.scheduled)");
  const baris = A.locator(`li[data-jendela="${jendela}"]`);
  harus(rec, (await baris.locator("form").count()) === 0, "the closed row draws no form");
  const aksi = baris.locator("[data-buka-ubah]");
  const nama = norm(await aksi.evaluate((el) => el.textContent));
  harus(rec, /^Batalkan · .+/.test(nama), `the row's one action is named with its window («${nama}»)`);
  await aksi.click();
  await A.waitForURL((u) => u.searchParams.get("ubah") === jendela, { timeout: SLOW });
  await A.waitForLoadState("networkidle");
  const terbuka = A.locator(`li[data-jendela="${jendela}"][data-terbuka]`);
  harus(rec, (await terbuka.count()) === 1, "the row opens in place, carried in the address (?ubah=)");
  harus(rec, await terbuka.locator('input[name="alasan"]').evaluate((el) => el === document.activeElement), "focus is on the reason");
  await shot(A, rec, "pemeliharaan-terbuka");
  await terbuka.locator('input[name="alasan"]').fill("Jadwal diganti");
  // Readiness B4 (Daisy, 8 Nov): a destructive act asks first, in place; focus goes to «Batal»; the act is red
  await terbuka.locator("[data-bahaya-buka]").click();
  const tanya = terbuka.locator("[data-bahaya-tanya]");
  harus(rec, (await tanya.count()) === 1 && await tanya.getByRole("button", { name: "Batal", exact: true }).evaluate((el) => el === document.activeElement),
    "ending it asks first, in place, with focus on «Batal»");
  await terbuka.locator('button[name="aksi"][value="AKHIRI"]').click();
  await A.waitForURL((u) => u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await A.waitForLoadState("networkidle");
  for (let i = 0; i < 20 && !sql(`select coalesce(ended_at::text, '') from public.maintenance_windows where id = '${jendela}'`); i++) await A.waitForTimeout(500);
  harus(rec, !!sql(`select coalesce(ended_at::text, '') from public.maintenance_windows where id = '${jendela}'`), "the window is cancelled");
  harus(rec, Number(jejak(sejak, "maintenance.cancelled", jendela)) >= 1, "the cancellation is audited (maintenance.cancelled)");
  harus(rec, (await A.locator(`li[data-jendela="${jendela}"][data-terbuka]`).count()) === 0, "after the save the row is closed again");
});

await browser.close();
writeFileSync(join(OUT, "admin-ujung.json"), JSON.stringify({ app: APP, tag: TAG, langkah }, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);

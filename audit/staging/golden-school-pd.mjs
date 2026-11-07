// STAGING ONLY. X5 (D-196) on deployed staging: a professional-development class's Ringkasan Kelas, by each audience,
// in a Golden School that GS-01 to GS-21 have walked (its admin, Kepala departemen of «Kelas Tinggi», Guru of «Kelas 5A»
// and Dekan exist). Staging held no professional-development class at all before this walk (P-7, 7 Nov: every org_node
// was LEARNER or none), so the place is built the way a school admin builds it. Every write is a press of PINTAR's
// buttons by a person signed in through the real screens; the database is only READ (read-only transactions).
//
//   D0  read only: the school, «Kelas 5A», its admin, Guru, Kepala departemen and Dekan, and the six Batch 9 reads.
//   D1  the school admin builds «Pengembangan Guru» for educators → «Angkatan Guru 2026» → «Kelas Pengembangan A» on
//       Struktur sekolah; all three are PROFESSIONAL_DEVELOPMENT.
//   D2  the facilitator, the PD Kepala departemen and a second Guru: names on Pendataan, accounts by email on Aktivasi,
//       roles on Peran & akses (Guru at the PD Kelas, Kepala departemen at the PD Bagian, Guru at «Kelas 5A»).
//   D3  the Guru of «Kelas 5A» and the second Guru enrolled on Konfigurasi «Peserta pengembangan profesi»
//       («Daftarkan sebagai peserta» → PD_ENROLLED); the enrolment makes no person, account or number.
//   D4  the PD Kelas's Ringkasan Kelas by the facilitator, the PD Kepala departemen, the Dekan, and the school admin
//       from Konfigurasi «Laporan»: the summary's mark, the owner's sentence, both participants named in alphabetical
//       order, no academic mark (topics, bands, dots, before/after, «Perlu penguatan»), nothing promised.
//   D5  the refused at the same address: the Kepala departemen of «Kelas Tinggi» (another department) and the Guru of
//       «Kelas 5A» (a participant, not its facilitator): no participant named, no academic mark.
//   D6  at 390 px (the facilitator): the page is no wider than the screen.
//   D7  A4 (the facilitator): printed, no navigation shows, the sentence is there; the PDF is kept for Daisy's review.
//   X1  everyone signs out.
//
// Not covered here, and why: the record's per-package table (steps, results) needs a published professional-learning
// package sat by a participant; that path is walked on the exact candidate in CI's journeys (job B, C12c–C12f2). This
// walk shows the participants «Belum diberi paket».
//
// NEVER production: staging's ref, database URL and origin are checked first. Never Dr Gladys's school: the school
// must be a «sekolah-uji-*» Golden School. A step that cannot run because an earlier one failed is BLOCKED.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf } from "./masuk.mjs";
import { catat as catatDi } from "./pendataan.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^sekolah-uji-[a-z0-9-]{1,30}$/.test(SLUG)) throw new Error(`«${SLUG}» is not a Golden School test slug`);
mkdirSync(join(OUT, "shots"), { recursive: true });

const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const KELAS = "Kelas 5A", BAGIAN_LAIN = "Kelas Tinggi";
const PD = { bagian: "Pengembangan Guru", tingkat: "Angkatan Guru 2026", kelas: "Kelas Pengembangan A" };
const U = SLUG.toUpperCase();
const GURU = `Guru ${U}`;
const BARU = [
  { kunci: "fasilitator", nama: `Fasilitator ${U}`, peran: "EDUCATOR", tempat: PD.kelas },
  { kunci: "kepalapd", nama: `Kepala PD ${U}`, peran: "HEAD_OF_DEPARTMENT", tempat: PD.bagian },
  { kunci: "guru2", nama: `Guru Kedua ${U}`, peran: "EDUCATOR", tempat: KELAS },
];
const PESERTA = [GURU, BARU[2].nama];
const KALIMAT = "Kelas pengembangan profesional tidak menggunakan ringkasan penguasaan akademik murid.";
// nothing academic is drawn (the class composition's sections and marks), and nothing says a figure will come (D-070(h))
const AKADEMIK = /data-lk="(topik|pita|kenaikan|keliru|tertahan|penguatan)"|data-lk-titik|data-lk-awal-akhir/;
const JANJI = /muncul setelah|Perlu penguatan|Sebaran hasil|Penguasaan per topik/;

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };

const hasil = [];
let shotN = 0;
async function shot(page, name) {
  const f = join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
}
async function step(id, judul, fn) {
  const rec = { verdict: "PASS", catatan: [] };
  try { await fn(rec); } catch (e) {
    rec.verdict = "FAIL";
    rec.catatan.push(`error: ${String(e.message ?? e).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" | ").slice(0, 400)}`);
  }
  hasil.push({ id, judul, verdict: rec.verdict, catatan: rec.catatan });
  log(`${rec.verdict.padEnd(7)} ${id}  ${judul} :: ${rec.catatan.join("; ")}`);
  if (rec.verdict === "FAIL") console.log(`::error title=${id}::${rec.catatan.join("; ").replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 900)}`);
  return rec.verdict === "PASS";
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
const terhalang = (rec, sebab) => { rec.verdict = "BLOCKED"; rec.catatan.push(sebab); };
const konteks = (lebar = 1280, tinggi = 900) => ({ viewport: { width: lebar, height: tinggi }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(page).catch(() => {});
}
const keadaan = keadaanDari(sql, lit);
const masuk = async (page, email) => (await masukStaf(page, email, keadaan)).di;
// read only, for the steps' evidence
// under `induk` anywhere below it: Struktur sekolah keeps hidden levels between those it shows (a Tingkat sits under the
// Bagian's «Reguler» programme, run 42426680421), so the parent a person chose is an ancestor, not always the parent
const simpul = (kind, nama, induk = null) => sql(`with recursive bawah as (
      select id from public.org_nodes where id = ${induk ? `'${uuid(induk)}'` : `'${S.id}'`}
      union all select o.id from public.org_nodes o join bawah b on o.parent_id = b.id)
    select n.id from public.org_nodes n where n.institution_id = '${S.id}' and n.kind = '${kind}' and n.name = ${lit(nama)} and n.is_active
      and n.id in (select id from bawah) and n.id <> ${induk ? `'${uuid(induk)}'` : `'${S.id}'`} limit 1`);
const orang = (nama) => sql(`select p.id from public.persons p join public.institutional_identities ii on ii.person_id = p.id
    where ii.institution_id = '${S.id}' and p.display_name = ${lit(nama)} limit 1`);
const akunSurel = (email) => sql(`select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id
    where lower(u.email) = lower(${lit(email)})`) !== "0";
const peranAktif = (nama, peran, node) => sql(`select count(*) from public.role_assignments r join public.persons p on p.id = r.person_id
    where r.institution_id = '${S.id}' and p.display_name = ${lit(nama)} and r.role = '${peran}' and r.scope_node_id = '${uuid(node)}'
      and r.revoked_at is null and now() < r.valid_until`) !== "0";
const anggota = (node, nama) => sql(`select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
    join public.persons p on p.id = e.person_id where m.node_id = '${uuid(node)}' and m.valid_to is null and p.display_name = ${lit(nama)}`) !== "0";

// Struktur sekolah: the «Tambah …» form under a given parent (by its hidden input), its name typed, its button pressed
async function tambahDi(page, tingkatan, nama, { induk = null, untukGuru = false } = {}) {
  await buka(page, `/konfigurasi/struktur?muat=${Date.now()}#struktur`);
  let f = page.locator(`div.pin-str-tambah-${tingkatan} form`);
  if (induk) f = f.filter({ has: page.locator(`input[name="${tingkatan === "tingkat" ? "bagian" : "tingkat"}"][value="${induk}"]`) });
  f = f.first();
  await f.waitFor({ state: "visible", timeout: SLOW });
  await f.locator('input[name="nama"]').fill(nama);
  if (untukGuru) await f.locator('input[name="untuk"][value="guru"]').check();
  await f.locator('button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
  for (let i = 0; i < 20; i++) { const id = simpul({ bagian: "DEPARTMENT", tingkat: "COHORT", kelas: "CLASS" }[tingkatan], nama, induk); if (id) return id; await page.waitForTimeout(1000); }
  return "";
}
// Peran & akses: person, role, place, until the school year ends; «Berikan peran»; the grant's own redirect is its answer
async function beriPeran(page, nama, peran, tempatNama) {
  const form = page.locator("form").filter({ has: page.locator('select[name="person"]') });
  let opsi = await form.locator('select[name="person"] option').filter({ hasText: nama }).first().getAttribute("value").catch(() => null);
  if (!opsi) { await page.reload({ waitUntil: "networkidle" }); opsi = await form.locator('select[name="person"] option').filter({ hasText: nama }).first().getAttribute("value").catch(() => null); }
  if (!opsi) throw new Error(`«${nama}» is not offered in the person list`);
  await form.locator('select[name="person"]').selectOption(opsi);
  await form.locator('select[name="role"]').selectOption(peran);
  const nilai = await form.locator('select[name="scope"] option').filter({ hasText: tempatNama }).first().getAttribute("value").catch(() => null);
  if (!nilai) throw new Error(`no place «${tempatNama}» offered`);
  await form.locator('select[name="scope"]').selectOption(nilai);
  await form.locator('input[name="valid_until"]').fill(S.akhir);
  const [jawab] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]), { timeout: SLOW }),
    form.getByRole("button", { name: "Berikan peran" }).click(),
  ]);
  const ke = String(jawab.headers()["x-action-redirect"] ?? "").split(";")[0];
  await page.waitForLoadState("networkidle");
  return ke ? new URL(ke, APP).searchParams.get("hasil") : `no redirect (HTTP ${jawab.status()})`;
}
// the summary as a reader sees it
async function bacaRingkasan(p) {
  await p.getByText("Ringkasan Kelas").first().waitFor({ timeout: SLOW }).catch(() => {});
  // outerHTML: the summary's mark is on <main> itself (data-ringkasan)
  const html = await p.locator("main").first().evaluate((el) => el.outerHTML).catch(() => "");
  const teks = norm(await p.locator("main").innerText().catch(() => ""));
  const posisi = PESERTA.map((n) => teks.toLowerCase().indexOf(n.toLowerCase()));
  const abjad = [...PESERTA].sort((x, y) => x.localeCompare(y, "id", { sensitivity: "base" }));
  const urut = posisi.every((i) => i >= 0) && abjad.map((n) => teks.toLowerCase().indexOf(n.toLowerCase())).every((v, i, a) => i === 0 || a[i - 1] < v);
  return { pd: html.includes('data-ringkasan="pengembangan"'), kalimat: teks.includes(KALIMAT), akademik: AKADEMIK.test(html), janji: JANJI.test(teks),
    nama: PESERTA.filter((n) => teks.toLowerCase().includes(n.toLowerCase())).length, urut, teks };
}

// ═══════════════════════════════════════════════════════════════════════════ D0
const browser = await chromium.launch();
let S = null;
await step("D0", `read only: «${SLUG}», «${KELAS}», its admin, Guru, Kepala departemen and Dekan; the Batch 9 reads`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || k.id || '|' ||
      coalesce((select p.ends_on::text from public.academic_periods p where p.institution_id = i.id order by p.starts_on desc limit 1), '-') || '|' ||
      (select count(*) from supabase_migrations.schema_migrations) || '|' ||
      (select count(*) from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace where n.nspname = 'public' and pr.proname in
        ('murid_perlu_penguatan','jenis_belajar_saya','sebaran_murid_kelas','kenaikan_awal_akhir','kesiapan_kelas_per_mapel','kelas_dikecualikan_kartu'))
    from public.institutions i join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
   where i.slug = ${lit(SLUG)} limit 1`);
  if (!harus(rec, !!r, `the school «${SLUG}» with «${KELAS}»`)) return;
  const [id, nama, kelas, akhir, migrasi, fungsi] = r.split("|");
  harus(rec, Number(migrasi) >= 200 && fungsi === "6", `staging holds ${migrasi} migrations and the six Batch 9 reads (${fungsi})`);
  harus(rec, akhir !== "-", `the school year ends ${akhir}`);
  for (const who of ["admin", "guru", "kabag", "dekan"]) harus(rec, keadaan(mail(who)) !== null, `the ${who} has an account`);
  if (rec.verdict === "PASS") S = { id: uuid(id), nama, kelas: uuid(kelas), akhir };
});
if (!S) { await browser.close(); log("RED: D0"); process.exit(1); }

const A = await (await browser.newContext(konteks())).newPage();
let adminMasuk = false;

// ═══════════════════════════════════════════════════════════════════════════ D1
const C = {};
await step("D1", `the school admin builds «${PD.bagian}» for educators → «${PD.tingkat}» → «${PD.kelas}» on Struktur sekolah`, async (rec) => {
  const di = await masuk(A, mail("admin"));
  adminMasuk = di === "/konfigurasi";
  if (!harus(rec, adminMasuk, `the admin signed in and landed on ${di}`)) return;
  C.bagian = simpul("DEPARTMENT", PD.bagian) || await tambahDi(A, "bagian", PD.bagian, { untukGuru: true });
  if (!harus(rec, !!C.bagian, `«${PD.bagian}» made`)) return;
  C.tingkat = simpul("COHORT", PD.tingkat, C.bagian) || await tambahDi(A, "tingkat", PD.tingkat, { induk: C.bagian });
  if (!harus(rec, !!C.tingkat, `«${PD.tingkat}» made under «${PD.bagian}»`)) return;
  C.kelas = simpul("CLASS", PD.kelas, C.tingkat) || await tambahDi(A, "kelas", PD.kelas, { induk: C.tingkat });
  if (!harus(rec, !!C.kelas, `«${PD.kelas}» made under «${PD.tingkat}»`)) return;
  await buka(A, `/konfigurasi/struktur?muat=${Date.now()}#struktur`);
  await shot(A, "d1-struktur");
  const k = sql(`select string_agg(name || ':' || learning_context::text || ':' || coalesce(member_kind, '-'), ', ' order by kind, name)
      from public.org_nodes where id in ('${C.bagian}','${C.tingkat}','${C.kelas}')`);
  harus(rec, (k.match(/PROFESSIONAL_DEVELOPMENT/g) ?? []).length === 3 && k.includes(`${PD.kelas}:PROFESSIONAL_DEVELOPMENT:PARTICIPANT`),
    `the three are professional development, the Kelas a class of participants (${k})`);
});

// ═══════════════════════════════════════════════════════════════════════════ D2
await step("D2", "the facilitator, the PD Kepala departemen and a second Guru: Pendataan, Aktivasi by email, Peran & akses", async (rec) => {
  if (!C.kelas) return terhalang(rec, "no PD Kelas (D1)");
  const tempatId = { [PD.kelas]: C.kelas, [PD.bagian]: C.bagian, [KELAS]: S.kelas };
  await buka(A, "/pendataan");
  const belum = BARU.filter((p) => !orang(p.nama)).map((p) => p.nama);
  if (belum.length) rec.catatan.push(`Pendataan: ${await catatDi(A, belum, {}, { shot })}`);
  harus(rec, BARU.every((p) => orang(p.nama)), `recorded ${BARU.filter((p) => orang(p.nama)).length}/3`);
  await buka(A, "/aktivasi");
  for (const p of BARU) {
    if (akunSurel(mail(p.kunci))) continue;
    const baris = A.locator("li.pin-akt-orang", { hasText: p.nama }).first();
    if (!(await baris.count())) { rec.catatan.push(`«${p.nama}» not on Aktivasi`); continue; }
    await baris.locator('input[type="email"]').fill(mail(p.kunci));
    await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
    await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  }
  await shot(A, "d2-aktivasi");
  harus(rec, BARU.every((p) => akunSurel(mail(p.kunci))), `accounts by email ${BARU.filter((p) => akunSurel(mail(p.kunci))).length}/3`);
  await buka(A, "/konfigurasi/roles");
  for (const p of BARU) {
    if (peranAktif(p.nama, p.peran, tempatId[p.tempat])) { rec.catatan.push(`${p.peran} for «${p.nama}» already held`); continue; }
    rec.catatan.push(`${p.peran} at «${p.tempat}»: hasil=${await beriPeran(A, p.nama, p.peran, p.tempat)}`);
  }
  await shot(A, "d2-peran");
  harus(rec, BARU.every((p) => peranAktif(p.nama, p.peran, tempatId[p.tempat])), "the three roles are held");
});

// ═══════════════════════════════════════════════════════════════════════════ D3
await step("D3", `the Guru of «${KELAS}» and the second Guru enrolled in «${PD.kelas}» on Konfigurasi «Peserta pengembangan profesi»`, async (rec) => {
  if (!C.kelas || !orang(BARU[2].nama)) return terhalang(rec, "no PD Kelas or no second Guru (D1, D2)");
  const hitung = () => sql(`select (select count(*) from public.persons) || '|' || (select count(*) from public.accounts) || '|' || (select count(*) from public.institutional_identities)`);
  const sebelum = hitung();
  for (const nama of PESERTA) {
    if (anggota(C.kelas, nama)) { rec.catatan.push(`«${nama}» already a participant`); continue; }
    await buka(A, `/konfigurasi/peserta?muat=${Date.now()}#peserta`);
    const fp = A.locator("form").filter({ has: A.locator('select[name="tempat"]') }).first();
    await fp.waitFor({ timeout: SLOW });
    const vo = await fp.locator('select[name="orang"] option').filter({ hasText: nama }).first().getAttribute("value").catch(() => null);
    const vt = await fp.locator('select[name="tempat"] option').filter({ hasText: PD.kelas }).first().getAttribute("value").catch(() => null);
    const tawaran = (await fp.locator('select[name="tempat"] option').allTextContents()).map(norm);
    if (!harus(rec, !!vo && !!vt, `the form offers «${nama}» ${!!vo} and «${PD.kelas}» ${!!vt}`)) continue;
    harus(rec, !tawaran.some((t) => t.includes(KELAS)), `«${KELAS}» is not offered as a professional-learning place`);
    await fp.locator('select[name="orang"]').selectOption(vo);
    await fp.locator('select[name="tempat"]').selectOption(vt);
    await fp.getByRole("button", { name: "Daftarkan sebagai peserta", exact: true }).click();
    await A.waitForURL(/hasil=/, { timeout: SLOW }).catch(() => {});
    await A.waitForLoadState("networkidle");
    const kode = new URL(A.url()).searchParams.get("kode");
    harus(rec, kode === "PD_ENROLLED" && anggota(C.kelas, nama), `«${nama}»: «Daftarkan sebagai peserta» → ${kode}; a participant ${anggota(C.kelas, nama)}`);
  }
  await shot(A, "d3-peserta");
  const sesudah = hitung();
  harus(rec, sebelum === sesudah, `the enrolment made no person, account or number (${sebelum} → ${sesudah})`);
});

// ═══════════════════════════════════════════════════════════════════════════ D4
const alamat = () => `/edukator/ringkasan?kelas=${C.kelas}`;
const halaman = {};
const terbuka = [];
await step("D4", `X5: «${PD.kelas}»'s Ringkasan Kelas by the facilitator, the PD Kepala departemen, the Dekan, and the school admin from Konfigurasi «Laporan»`, async (rec) => {
  if (!C.kelas || !PESERTA.every((n) => anggota(C.kelas, n))) return terhalang(rec, "no PD Kelas with its two participants (D1–D3)");
  const lihat = async (siapa, email) => {
    const p = await (await browser.newContext(konteks())).newPage();
    halaman[siapa] = p; terbuka.push([siapa, p]);
    const di = await masuk(p, email);
    await buka(p, alamat());
    const r = await bacaRingkasan(p);
    await shot(p, `d4-${siapa}`);
    return { ...r, di };
  };
  const hasilnya = [
    ["the facilitator", await lihat("fasilitator", mail("fasilitator"))],
    ["the PD Kepala departemen", await lihat("kepalapd", mail("kepalapd"))],
    ["the Dekan", await lihat("dekan", mail("dekan"))],
  ];
  // the school admin by the way a person goes: Konfigurasi «Laporan» lists every active Kelas, the PD Kelas among them
  await buka(A, `/konfigurasi/laporan?muat=${Date.now()}#laporan`);
  const tautan = A.locator(`#laporan a[href="${alamat()}&dari=konfigurasi"]`).first();
  const adaTautan = (await tautan.count()) > 0;
  harus(rec, adaTautan, "Konfigurasi «Laporan» links the PD Kelas's summary");
  if (adaTautan) { await tautan.click(); await A.waitForURL((u) => u.pathname === "/edukator/ringkasan", { timeout: SLOW }).catch(() => {}); await A.waitForLoadState("networkidle"); }
  else await buka(A, alamat());
  const adm = await bacaRingkasan(A);
  await shot(A, "d4-admin");
  hasilnya.push(["the school admin", adm]);
  for (const [siapa, r] of hasilnya) {
    harus(rec, r.pd && r.kalimat && !r.akademik && !r.janji && r.nama === 2 && r.urut,
      `${siapa}${r.di ? ` (signed in, landed ${r.di})` : ""}: summary ${r.pd}, the sentence ${r.kalimat}, academic marks ${r.akademik}, a promise or band ${r.janji}, participants named ${r.nama}/2, alphabetical ${r.urut}`);
  }
  harus(rec, /Belum diberi paket/.test(hasilnya[0][1].teks), "the facilitator reads «Belum diberi paket: …» (no package given yet)");
});

// ═══════════════════════════════════════════════════════════════════════════ D5
await step("D5", `the refused at the same address: the Kepala departemen of «${BAGIAN_LAIN}» and the Guru of «${KELAS}» (a participant)`, async (rec) => {
  if (!C.kelas) return terhalang(rec, "no PD Kelas (D1)");
  for (const [siapa, kunci] of [["kabag", "kabag"], ["guru", "guru"]]) {
    const p = await (await browser.newContext(konteks())).newPage();
    halaman[siapa] = p; terbuka.push([siapa, p]);
    await masuk(p, mail(kunci));
    await buka(p, alamat());
    const html = await p.content();
    // the page's own content: the shell's account menu names the reader, which is not the record
    const teks = norm(await p.locator("main").innerText().catch(() => ""));
    await shot(p, `d5-${siapa}`);
    const nama = PESERTA.filter((n) => teks.toLowerCase().includes(n.toLowerCase()));
    harus(rec, nama.length === 0 && !AKADEMIK.test(html), `the ${siapa === "kabag" ? `Kepala departemen of «${BAGIAN_LAIN}»` : `Guru of «${KELAS}»`}: participants named ${JSON.stringify(nama)}, academic marks ${AKADEMIK.test(html)}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════ D6
await step("D6", "at 390 px (the facilitator): the summary stays inside the screen", async (rec) => {
  const p = halaman.fasilitator;
  if (!p) return terhalang(rec, "the facilitator did not open the summary (D4)");
  await p.setViewportSize({ width: 390, height: 844 });
  await buka(p, alamat());
  const w = await p.evaluate(() => ({ dok: document.documentElement.scrollWidth, layar: window.innerWidth }));
  await shot(p, "d6-fasilitator-390");
  harus(rec, w.dok <= w.layar, `the page is ${w.dok} px wide on a ${w.layar} px screen`);
  await p.setViewportSize({ width: 1280, height: 900 });
});

// ═══════════════════════════════════════════════════════════════════════════ D7
await step("D7", "A4 (the facilitator): printed, no navigation shows, the owner's sentence and both participants are there; the PDF is kept", async (rec) => {
  const p = halaman.fasilitator;
  if (!p) return terhalang(rec, "the facilitator did not open the summary (D4)");
  await buka(p, alamat());
  await p.emulateMedia({ media: "print" });
  const nav = await p.evaluate(() => [...document.querySelectorAll("nav, header")].filter((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none").length);
  const r = await bacaRingkasan(p);
  harus(rec, nav === 0, `printed, no navigation or header shows (${nav})`);
  harus(rec, r.kalimat && r.nama === 2 && !r.akademik, `the sentence ${r.kalimat}, participants ${r.nama}/2, academic marks ${r.akademik}`);
  const pdf = await p.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  writeFileSync(join(OUT, "d7-ringkasan-pengembangan-a4.pdf"), pdf);
  const halamanPdf = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  harus(rec, halamanPdf >= 1, `the A4 PDF has ${halamanPdf} page(s) (d7-ringkasan-pengembangan-a4.pdf, in the artifact)`);
  await p.emulateMedia({ media: "screen" });
});

// ═══════════════════════════════════════════════════════════════════════════ X1
await step("X1", "everyone signs out", async (rec) => {
  for (const [siapa, p] of [["admin", A], ...terbuka]) {
    try {
      // a page inside the staff shell, where «Keluar» is
      await buka(p, siapa === "admin" ? "/konfigurasi" : alamat());
      const dari = new URL(p.url()).pathname;
      const b = p.getByRole("button", { name: "Keluar", exact: true }).first();
      if (!(await b.count())) { rec.catatan.push(`${siapa}: no «Keluar» on ${dari}`); continue; }
      await b.click();
      await p.waitForURL((u) => u.pathname !== dari, { timeout: SLOW });
      rec.catatan.push(`${siapa} «Keluar» → ${new URL(p.url()).pathname}`);
    } catch (e) { harus(rec, false, `${siapa}: «Keluar» failed (${String(e.message ?? e).split("\n")[0].slice(0, 100)})`); }
  }
});

await browser.close();
writeFileSync(join(OUT, "golden-school-pd.json"), JSON.stringify({ app: APP, slug: SLUG, hasil }, null, 2));
const n = (v) => hasil.filter((h) => h.verdict === v).length;
log(`\n${n("PASS")}/${hasil.length} PASS, ${n("FAIL")} FAIL, ${n("BLOCKED")} BLOCKED`);
process.exit(n("FAIL") || n("BLOCKED") ? 1 : 0);

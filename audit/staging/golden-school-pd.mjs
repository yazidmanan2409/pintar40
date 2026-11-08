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
//   D9  the PD package: the school admin uploads the professional-learning workbook (audit/staging/fixtures/
//       PD-Sintetis-Bab1.xlsx, «Konteks: Pengembangan profesi») on Studio's upload page, checked and saved as a draft;
//       the course is PROFESSIONAL_DEVELOPMENT.
//   D10 the seven steps by two people: the admin composes, checks and submits; the PD Kepala departemen reads every
//       question with its key and reasons, approves, makes and locks the release, reviews any finding; the admin is
//       never offered the second person's steps; the admin publishes.
//   D11 the admin sets the package's pass mark on Batas ketuntasan.
//   D12 the facilitator gives it to the PD Kelas on Siapkan; the PD Kelas's Siapkan does not offer the academic chapter.
//   D13 the record's per-package table by each audience: the facilitator, the PD Kepala departemen and the Dekan see the
//       steps and the result columns; the admin sees enrolment and completion only; both participants, alphabetical.
//   D8  the platform administrator's report boundary (D-132(g), D-195(5), D-069(b); F33-PA01 at the database): the
//       Platform Operator (SYSTEM_ADMIN, no role at the school), in «Seluruh platform», at «Kelas 5A»'s report reads
//       the class's figures and no learner by name, no score-line dot; at the PD Kelas's summary, no participant.
//   X1  everyone signs out.
//
// Not covered here, and why: a participant sitting the PD package (its steps done and its result) needs the answers
// and the player; that path is walked on the exact candidate in CI's journeys (job B, C12d–C12f2). Here the record's
// table shows the participants given the package and not yet started.
//
// NEVER production: staging's ref, database URL and origin are checked first. Never Dr Gladys's school: the school
// must be a «sekolah-uji-*» Golden School. A step that cannot run because an earlier one failed is BLOCKED.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf, pilihKonteks } from "./masuk.mjs";
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
// L3 (D-132): a person holding several purposes lands on the chooser and picks one, as a person does (run 42427201822:
// the PD Kepala departemen and the other Kepala departemen hold Mengajar and Mengelola, and the walk had not chosen)
const masuk = async (page, email, tujuan = null) => {
  const di = (await masukStaf(page, email, keadaan)).di;
  if (di !== "/" || !tujuan) return di;
  return `/ → ${await pilihKonteks(page, { tujuan, nama: S.nama })}`;
};
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
  const lihat = async (siapa, email, tujuan = null) => {
    const p = await (await browser.newContext(konteks())).newPage();
    halaman[siapa] = p; terbuka.push([siapa, p]);
    const di = await masuk(p, email, tujuan);
    await buka(p, alamat());
    const r = await bacaRingkasan(p);
    await shot(p, `d4-${siapa}`);
    return { ...r, di };
  };
  const hasilnya = [
    ["the facilitator", await lihat("fasilitator", mail("fasilitator"))],
    ["the PD Kepala departemen", await lihat("kepalapd", mail("kepalapd"), "MENGELOLA")],
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
  for (const [siapa, kunci, tujuan] of [["kabag", "kabag", "MENGELOLA"], ["guru", "guru", "MENGAJAR"]]) {
    const p = await (await browser.newContext(konteks())).newPage();
    halaman[siapa] = p; terbuka.push([siapa, p]);
    const di = await masuk(p, mail(kunci), tujuan);
    await buka(p, alamat());
    // a refusal counts only on the summary's own address (run 42427201822's «refused» Kepala departemen was on the chooser)
    const jalan = new URL(p.url()).pathname;
    harus(rec, jalan === "/edukator/ringkasan", `the ${siapa} (landed ${di}) reads the summary's address (${jalan})`);
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

// ═══════════════════════════════════════════════════════════════════════════ D9–D13 the PD package
const BUKU_PD = fileURLToPath(new URL("./fixtures/PD-Sintetis-Bab1.xlsx", import.meta.url));
const JUDUL_PD = "[UJI INTERNAL] Pengembangan Profesi · Bab 1: Mengajarkan Pola Bilangan";
const BATAS_PD = { persen: "60", alasan: "Ketentuan uji pengembangan profesi" };
let kursusPd = null;
const babPd = () => { const r = sql(`select c.id || '|' || c.learning_context::text || '|' || c.status::text from public.courses c
    where c.institution_id = '${S.id}' and c.title = ${lit(JUDUL_PD)} order by c.created_at desc limit 1`); return r ? r.split("|") : null; };
const keadaanPd = () => {
  const [k, t] = sql(`select c.status::text || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id
      order by r.created_at desc limit 1), '-') from public.courses c where c.id = '${kursusPd}'`).split("|");
  return { kursus: k, terbitan: t };
};
const teksPd = () => { const k = keadaanPd(); return `${k.kursus}/${k.terbitan}`; };
// the step the package page offers next, and whose it is (as the admin walk's A9: langkah.ts)
const langkahPd = () => {
  const k = keadaanPd();
  if (k.terbitan === "PUBLISHED") return null;
  if (k.terbitan === "FROZEN") return { kunci: "terbitkan", tombol: "Terbitkan", siapa: "admin" };
  if (k.terbitan !== "-") return { kunci: "kunci", tombol: "Kunci terbitan", siapa: "kepalapd" };
  return {
    INGESTED: { kunci: "susun", tombol: "Tandai sudah tersusun", siapa: "admin" },
    VALIDATION_FAILED: { kunci: "susun", tombol: "Tandai sudah tersusun", siapa: "admin" },
    STRUCTURED: { kunci: "periksa", tombol: "Tandai lolos pemeriksaan", siapa: "admin" },
    VALIDATED: { kunci: "ajukan", tombol: "Ajukan untuk ditinjau", siapa: "admin" },
    IN_REVIEW: { kunci: "setujui", tombol: "Setujui isi", siapa: "kepalapd" },
    APPROVED: { kunci: "buat", tombol: "Buat terbitan", siapa: "kepalapd" },
  }[k.kursus] ?? null;
};
async function tekanPd(page, tombol) {
  await page.reload({ waitUntil: "networkidle" });
  await closeTour(page).catch(() => {});
  let b = page.getByRole("button", { name: tombol, exact: true });
  const gabung = tombol === "Buat terbitan" && !(await b.count());
  if (gabung) b = page.getByRole("button", { name: "Kunci terbitan", exact: true });
  if (!(await b.count())) return { tidakAda: true };
  const sebelum = teksPd();
  await b.first().click();
  let sesudah = sebelum;
  for (let i = 0; i < 40 && sesudah === sebelum; i++) { await page.waitForTimeout(500); sesudah = teksPd(); }
  for (let i = 0; gabung && i < 40 && keadaanPd().terbitan !== "FROZEN"; i++) { await page.waitForTimeout(500); sesudah = teksPd(); }
  await page.waitForLoadState("networkidle");
  return { sesudah: sesudah === sebelum ? null : sesudah };
}

await step("D9", `the PD package: the school admin uploads «${JUDUL_PD}» from the professional-learning workbook, checked, saved to Studio as a draft`, async (rec) => {
  if (!adminMasuk) return terhalang(rec, "the admin is not signed in (D1)");
  if (!harus(rec, existsSync(BUKU_PD), "the workbook is in the walk's fixtures")) return;
  const ada = babPd();
  if (ada) { kursusPd = ada[0]; rec.catatan.push(`already in the school, nothing uploaded: ${ada[1]} ${ada[2]}`); harus(rec, ada[1] === "PROFESSIONAL_DEVELOPMENT", "the course is professional development"); return; }
  await buka(A, "/studio/unggah");
  const sel = A.locator("#ung-sekolah");
  const v = await sel.locator("option").filter({ hasText: S.nama }).first().getAttribute("value").catch(() => null);
  if (!harus(rec, !!v, `«${S.nama}» is offered on the upload page`)) return;
  await sel.selectOption(v);
  await A.locator("#ung-berkas").setInputFiles(BUKU_PD);
  await A.getByRole("button", { name: "Periksa buku kerja", exact: true }).click();
  const lolos = await A.getByText("Buku kerja lolos pemeriksaan.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(A, "d9-periksa");
  if (!harus(rec, lolos, `«Periksa buku kerja» passes`)) { rec.catatan.push(norm(await A.locator(".pin-ung").innerText().catch(() => "")).slice(0, 300)); return; }
  await A.getByRole("button", { name: "Simpan ke Studio", exact: true }).click();
  const simpan = await A.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(A, "d9-tersimpan");
  harus(rec, simpan, "«Tersimpan di Studio sebagai draf.»");
  const b = babPd();
  if (!harus(rec, !!b, "the course is in the school")) return;
  kursusPd = b[0];
  harus(rec, b[1] === "PROFESSIONAL_DEVELOPMENT", `the course is professional development (${b[1]}, ${b[2]})`);
});

await step("D10", "the seven steps by two people: the admin composes, checks, submits and publishes; the PD Kepala departemen reads every question, approves, makes and locks the release", async (rec) => {
  if (!kursusPd) return terhalang(rec, "no PD package (D9)");
  const halamanPd = { admin: A, kepalapd: halaman.kepalapd };
  if (!halamanPd.kepalapd) return terhalang(rec, "the PD Kepala departemen is not signed in (D4)");
  rec.catatan.push(`from ${teksPd()}`);
  const alamatPaket = `/studio/paket/${kursusPd}`;
  for (let n = 0; n < 9; n++) {
    const l = langkahPd();
    if (!l) break;
    const page = halamanPd[l.siapa];
    if (new URL(page.url()).pathname !== alamatPaket) await buka(page, alamatPaket);
    if (["setujui", "kunci"].includes(l.kunci)) {
      if (new URL(A.url()).pathname !== alamatPaket) await buka(A, alamatPaket); else await A.reload({ waitUntil: "networkidle" });
      harus(rec, !(await A.getByRole("button", { name: l.tombol, exact: true }).count()), `the author is not offered «${l.tombol}»`);
    }
    if (l.kunci === "setujui") {
      // D-088(h): the reviewer reads every lesson's questions, keys and reasons, a lesson at a time
      let diLayar = 0;
      for (let i = 1; i <= 50; i++) {
        diLayar += await page.locator("#soal li.pin-soal").count();
        const lanjut = page.locator('#soal a[data-pager="sesudah"][rel="next"]').first();
        if (!(await lanjut.count())) break;
        await lanjut.click();
        await page.waitForURL((u) => u.searchParams.get("pelajaran") === String(i + 1), { timeout: SLOW });
        await page.waitForLoadState("networkidle");
      }
      const soal = Number(sql(`select count(*) from public.items i join public.lessons x on x.id = i.lesson_id join public.modules m on m.id = x.module_id where m.course_id = '${kursusPd}'`));
      harus(rec, soal > 0 && diLayar === soal, `the PD Kepala departemen reads ${diLayar}/${soal} questions`);
    }
    if (l.kunci === "terbitkan") {
      const siap = () => sql(`select status || ' | ' || coalesce(blockers::text, '') from public.publish_readiness('${kursusPd}')`);
      if (siap().startsWith("BLOCKED")) { harus(rec, false, `readiness ${siap().slice(0, 160)}`); break; }
      if (!siap().startsWith("READY")) {
        const H = halamanPd.kepalapd;
        await buka(H, alamatPaket);
        let ditinjau = 0;
        for (let i = 0; i < 80; i++) {
          await H.reload({ waitUntil: "networkidle" });
          const ack = H.getByRole("button", { name: /^Sudah saya tinjau( semuanya)?$/ });
          if (!(await ack.count())) break;
          const terbuka = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id = '${kursusPd}' and acknowledged_at is null)
            + (select count(*) from public.coaching_findings where course_id = '${kursusPd}' and acknowledged_at is null)`));
          const n0 = terbuka();
          await ack.first().click();
          for (let k = 0; k < 20 && terbuka() === n0; k++) await H.waitForTimeout(300);
          ditinjau += 1;
        }
        rec.catatan.push(`the PD Kepala departemen reviewed ${ditinjau} finding(s); readiness ${siap().slice(0, 80)}`);
      }
      if (new URL(A.url()).pathname !== alamatPaket) await buka(A, alamatPaket);
    }
    const t = await tekanPd(page, l.tombol);
    await shot(page, `d10-${l.kunci}`);
    if (t.tidakAda || !t.sesudah) {
      harus(rec, false, `${l.kunci}: «${l.tombol}» ${t.tidakAda ? "not offered" : "moved nothing"} for ${l.siapa} (${teksPd()})`);
      break;
    }
    rec.catatan.push(`«${l.tombol}» by ${l.siapa === "admin" ? "the admin" : "the PD Kepala departemen"} → ${t.sesudah}`);
  }
  const r = sql(`select r.status::text || '|' || (r.content_sha256 is not null)::text || '|' || coalesce(v.display_name, '-')
      from public.plp_releases r left join public.persons v on v.id = r.reviewed_by_person_id where r.course_id = '${kursusPd}' order by r.created_at desc limit 1`);
  const [status, segel, peninjau] = (r || "-|-|-").split("|");
  harus(rec, status === "PUBLISHED" && segel === "true" && peninjau === BARU[1].nama, `the release ${status}, sealed ${segel}, reviewed by «${peninjau}»`);
});

await step("D11", `the admin sets the PD package's pass mark (${BATAS_PD.persen}%) on Batas ketuntasan`, async (rec) => {
  if (!kursusPd || keadaanPd().terbitan !== "PUBLISHED") return terhalang(rec, "the PD package is not published (D10)");
  const ditetapkan = () => sql(`select m.percent::text from public.school_pass_marks m where m.institution_id = '${S.id}'
      and m.course_id = public.course_lineage_root('${kursusPd}') and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`);
  if (ditetapkan()) { rec.catatan.push(`already set: ${ditetapkan()}%`); return; }
  await buka(A, `/konfigurasi/ketuntasan?sekolah=${S.id}&muat=${Date.now()}#ketuntasan`);
  const baris = A.locator(`#ketuntasan li[data-pelajaran="${kursusPd}"]`);
  if (!harus(rec, (await baris.count()) > 0, "Batas ketuntasan lists the PD package")) return;
  await baris.locator("[data-buka-ubah]").click();
  await baris.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await baris.locator('input[name="persen"]').fill(BATAS_PD.persen);
  await baris.locator('input[name="alasan"]').fill(BATAS_PD.alasan);
  await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
  await A.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW }).catch(() => {});
  await A.waitForLoadState("networkidle");
  await shot(A, "d11-ketuntasan");
  harus(rec, ditetapkan() === BATAS_PD.persen, `the pass mark reads ${ditetapkan() || "none"}%`);
});

await step("D12", `the facilitator gives the PD package to «${PD.kelas}» on Siapkan; the academic chapter is not offered there`, async (rec) => {
  if (!kursusPd || keadaanPd().terbitan !== "PUBLISHED") return terhalang(rec, "the PD package is not published (D10)");
  const F = halaman.fasilitator;
  if (!F) return terhalang(rec, "the facilitator is not signed in (D4)");
  const tugas = () => sql(`select count(*) from public.learning_assignments where course_id = '${kursusPd}' and node_id = '${C.kelas}'`);
  if (tugas() !== "0") { rec.catatan.push("the PD Kelas already has the package"); return; }
  await buka(F, `/mengajar/${C.kelas}/siapkan`);
  const daftar = norm(await F.locator("main").innerText().catch(() => ""));
  harus(rec, !/Matematika Kelas 5/.test(daftar), "the PD Kelas's Siapkan does not offer the academic chapter");
  const baris = F.locator(`a.pin-row[href^="/mengajar/${C.kelas}/siapkan?terbitan="]`).filter({ hasText: "Pengembangan Profesi" }).first();
  if (!harus(rec, (await baris.count()) > 0, "Siapkan offers the PD package")) { rec.catatan.push(daftar.slice(0, 240)); return; }
  await baris.click();
  await F.waitForURL((u) => u.searchParams.has("terbitan"), { timeout: SLOW });
  await F.waitForLoadState("networkidle");
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 30 * 86400000));
  await F.locator("#pin-sampai").fill(sampai).catch(() => {});
  const batas = norm(await F.locator(".pin-batas").first().innerText().catch(() => ""));
  harus(rec, new RegExp(`${BATAS_PD.persen}\\s?%`).test(batas), `Siapkan shows the school's pass mark («${batas.slice(0, 80)}»)`);
  await F.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await F.waitForLoadState("networkidle");
  for (let i = 0; i < 20 && tugas() === "0"; i++) await F.waitForTimeout(500);
  await shot(F, "d12-siapkan");
  const segel = sql(`select coalesce(string_agg(d.mode::text || ':' || coalesce(aa.pass_mark::text, '-'), ',' order by d.mode::text), '-')
      from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      join public.learning_assignments la on la.id = aa.learning_assignment_id where la.course_id = '${kursusPd}' and la.node_id = '${C.kelas}'`);
  harus(rec, tugas() !== "0" && /POST_TEST:0\.60/.test(segel), `the PD Kelas has the package (${tugas()}); tests sealed ${segel}`);
});

await step("D13", "the record's per-package table by each audience: steps and result for the facilitator, the PD Kepala departemen and the Dekan; completion only for the admin", async (rec) => {
  if (!kursusPd || sql(`select count(*) from public.learning_assignments where course_id = '${kursusPd}' and node_id = '${C.kelas}'`) === "0")
    return terhalang(rec, "the PD Kelas has no package (D12)");
  const PENUH = ["Pelajaran selesai", "Hasil"];
  for (const [siapa, p, penuh] of [["the facilitator", halaman.fasilitator, true], ["the PD Kepala departemen", halaman.kepalapd, true], ["the Dekan", halaman.dekan, true], ["the school admin", A, false]]) {
    if (!p) { harus(rec, false, `${siapa} is not signed in (D4)`); continue; }
    await buka(p, alamat());
    const r = await p.evaluate(() => ({
      tabel: document.querySelectorAll("[data-pd-paket]").length,
      kolom: [...new Set([...document.querySelectorAll("[data-pd-paket] thead th")].map((th) => th.textContent.trim()))],
      baris: [...document.querySelectorAll("[data-pd-paket] tbody th[scope=row]")].map((th) => (th.childNodes[0]?.textContent ?? "").trim()),
    }));
    const html = await p.locator("main").first().evaluate((el) => el.outerHTML).catch(() => "");
    await shot(p, `d13-${siapa.split(" ").pop().toLowerCase()}`);
    const abjad = [...r.baris].sort((x, y) => x.localeCompare(y, "id", { sensitivity: "base" }));
    const kolomOk = penuh ? PENUH.every((k) => r.kolom.includes(k)) : PENUH.every((k) => !r.kolom.includes(k)) && r.kolom.includes("Selesai");
    harus(rec, r.tabel >= 1 && r.baris.length === 2 && JSON.stringify(r.baris) === JSON.stringify(abjad) && kolomOk && !AKADEMIK.test(html),
      `${siapa}: ${r.tabel} table(s), rows ${JSON.stringify(r.baris)}, columns ${JSON.stringify(r.kolom)}, academic marks ${AKADEMIK.test(html)}`);
  }
  // the A4 print of the record with its table, kept for Daisy (the multipage header is walked in CI's journeys)
  const F = halaman.fasilitator;
  if (F) {
    await buka(F, alamat());
    await F.emulateMedia({ media: "print" });
    writeFileSync(join(OUT, "d13-catatan-pengembangan-a4.pdf"), await F.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true }));
    await F.emulateMedia({ media: "screen" });
    rec.catatan.push("the record with its table printed to d13-catatan-pengembangan-a4.pdf");
  }
});

// ═══════════════════════════════════════════════════════════════════════════ D8
const OPERATOR = "goldenschool+operator@pintarselalu.com";
await step("D8", "the platform administrator in «Seluruh platform»: the class's figures, no learner by name or dot; the PD Kelas, no participant", async (rec) => {
  if (!C.kelas) return terhalang(rec, "no PD Kelas (D1)");
  if (!harus(rec, keadaan(OPERATOR) !== null, "the Platform Operator has an account")) return;
  const p = await (await browser.newContext(konteks())).newPage();
  halaman.operator = p; terbuka.push(["operator", p]);
  await masukStaf(p, OPERATOR, keadaan);
  const di = await pilihKonteks(p, { tujuan: "MENGELOLA", platform: true });
  rec.catatan.push(`«Seluruh platform» chosen, landed ${di}`);
  // the academic class report, as the database answers this reader: figures (D-132(g)), nothing personal (D-195(5))
  await buka(p, `/edukator/ringkasan?kelas=${S.kelas}`);
  const jalan = new URL(p.url()).pathname;
  const html = await p.locator("main").first().evaluate((el) => el.outerHTML).catch(() => "");
  const teks = norm(await p.locator("main").innerText().catch(() => ""));
  await shot(p, "d8-operator-kelas");
  const murid = sql(`select string_agg(p.display_name, '|') from public.memberships m join public.enrollments e on e.id = m.enrollment_id
      join public.persons p on p.id = e.person_id where m.node_id = '${S.kelas}' and m.valid_to is null`).split("|").filter(Boolean);
  const disebut = murid.filter((n) => teks.toLowerCase().includes(n.toLowerCase()));
  harus(rec, jalan === "/edukator/ringkasan", `the class report's address is read (${jalan})`);
  harus(rec, disebut.length === 0, `no learner of «${KELAS}» is named (${murid.length} placed; named ${JSON.stringify(disebut)})`);
  harus(rec, !/data-lk-titik/.test(html), "no dot of the score line is drawn");
  rec.catatan.push(`the class's figures drawn: ${/data-lk="(topik|pita|kenaikan)"/.test(html)} (D-132(g): the platform's authority is broad; recorded)`);
  // the PD Kelas: D-069(b), no PD analytics for the platform
  await buka(p, alamat());
  const teksPd = norm(await p.locator("main").innerText().catch(() => ""));
  await shot(p, "d8-operator-pd");
  const pdDisebut = PESERTA.filter((n) => teksPd.toLowerCase().includes(n.toLowerCase()));
  harus(rec, pdDisebut.length === 0, `the PD Kelas names no participant to the platform (${JSON.stringify(pdDisebut)})`);
  harus(rec, !AKADEMIK.test(await p.content()), "and draws no academic mark");
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

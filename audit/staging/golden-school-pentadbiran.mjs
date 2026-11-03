// STAGING ONLY. The Batch 4 administration journey on deployed staging (owner, 3 Nov: «BATCH 4 PROMOTION GATE»,
// D-153), in a Golden School that GS-01 to GS-21 have walked (its admin, head of department, Guru, Dekan and five
// learners with class cards exist), and a second Golden School that receives a transfer. Every write is a press of
// PINTAR's buttons by a person signed in through the real screens; the database is only READ (read-only
// transactions), to assert what was recorded.
//
//   P0  read only: the two schools, «Kelas 5A», the people, staging's 188 migrations and the Batch 4 functions.
//   P1  the Guru's class page lists «Kelas 5A»'s learners as a Table (W3.5, J2Kelas), each name opening the record.
//   P2  the staging Platform Operator, in «Seluruh platform», corrects the Dekan's NAME on «Koreksi data orang» with a
//       reason (identity.name_corrected), then its USERNAME (identity.username_corrected); and puts both back the same
//       way, so the Golden School is left as it was (W2.2, W2.3, F-8).
//   P3  the school admin makes nothing new: one learner's class card becomes an email account on Aktivasi «Murid yang
//       menjadi staf», by the Platform Operator with a reason (account.card_converted_to_email; the same account row
//       is EMAIL, set-up REQUIRED) (D-152(a)).
//   P4  the Operator corrects that not-yet-activated person's address on «Koreksi data orang»
//       (identity.email_corrected) (W2.1); the person then activates with the code emailed to the corrected address
//       and signs in; a staff role is no longer refused by CR-91 (read only: they hold no class card).
//   P5  the school admin finds the receiving school by its exact name and asks for a learner's transfer with a reason
//       (directory.school_searched, transfer.requested) (W2.15, F-10).
//   P6  the receiving school's admin sees the request with the learner's name, accepts it into its own school year
//       and executes it (transfer.authorized, transfer.executed); the learner is enrolled there and the sending
//       enrolment is ENDED, kept; the learner's identity rows are unchanged.
//   P7  the school admin's Konfigurasi shows «Yang menunggu» exactly when something waits, each count opening its
//       place (UX-33); the Operator reads «Pengiriman tertahan» on «Email uji» (W2.19) and the schools a page at a
//       time on Konfigurasi (W2.10).
//   P8  the school admin adds a profile photo on «Akun saya», sees it, and removes it (W2.8).
//
// NEVER production: staging's ref, database URL and origin are checked first. Never Dr Gladys's school: the two
// schools must be «sekolah-uji-*» Golden Schools. A step that cannot run because an earlier one failed is BLOCKED.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf, pilihKonteks } from "./masuk.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const TUJUAN = env("GS_OTHER_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
for (const s of [SLUG, TUJUAN]) {
  if (!/^sekolah-uji-[a-z0-9-]{1,30}$/.test(s)) throw new Error(`«${s}» is not a Golden School test slug`);
}
if (SLUG === TUJUAN) throw new Error("the receiving school must be another school");
mkdirSync(join(OUT, "shots"), { recursive: true });

const mail = (who, slug = SLUG) => `goldenschool+${slug}-${who}@pintarselalu.com`;
const OPERATOR = "goldenschool+operator@pintarselalu.com";
const KELAS = "Kelas 5A";
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
const STAF_BARU = MURID[4];   // Eka's card becomes an email account
const PINDAH = MURID[3];      // Dimas moves to the receiving school
const RUN = (process.env.GITHUB_RUN_ID ?? String(Date.now())).slice(-6);
const SUREL_STAF = mail(`eka-staf-${RUN}`);
const SUREL_BENAR = mail(`eka-${RUN}`);

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const jejakSejak = () => Number(sql("select coalesce(max(id), 0) from public.audit_log"));
const jejak = (sejak, aksi, target) => Number(sql(`select count(*) from public.audit_log where id > ${sejak} and action = ${lit(aksi)}`
  + (target ? ` and target_id = ${lit(target)}` : "")));
const orangDari = (nama) => sql(`select p.id from public.persons p join public.enrollments e on e.person_id = p.id
  join public.institutions i on i.id = e.institution_id where p.display_name = ${lit(nama)} and i.slug = ${lit(SLUG)} limit 1`);
const orangSurel = (email) => sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id
  where lower(u.email) = lower(${lit(email)}) limit 1`);

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
  if (rec.verdict !== "PASS") console.log(`::error title=${id}::${rec.catatan.join("; ").replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 900)}`);
  return rec.verdict === "PASS";
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
const terhalang = (rec, sebab) => { rec.verdict = "BLOCKED"; rec.catatan.push(sebab); };
const konteks = () => ({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(page).catch(() => {});
}
async function tunggu(cek, kali = 40) {
  for (let i = 0; i < kali; i++) { if (cek()) return true; await new Promise((r) => setTimeout(r, 500)); }
  return cek();
}

// ═══════════════════════════════════════════════════════════════════════════ P0
const browser = await chromium.launch();
let S = null, T = null;
await step("P0", `read only: «${SLUG}» and «${TUJUAN}», «${KELAS}», the people, staging's Batch 4 migrations`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || k.id || '|' || (select count(*) from supabase_migrations.schema_migrations) || '|'
      || (to_regprocedure('public.orang_berakun(text,integer,integer,uuid)') is not null)::text || '|'
      || (to_regprocedure('public.authorize_card_conversion(uuid,text,text)') is not null)::text
    from public.institutions i join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
   where i.slug = ${lit(SLUG)} limit 1`);
  if (!harus(rec, !!r, `the school «${SLUG}» with «${KELAS}»`)) return;
  const [id, nama, kelas, migrasi, orang, kartu] = r.split("|");
  harus(rec, Number(migrasi) >= 188 && orang === "true" && kartu === "true", `staging holds ${migrasi} migrations and the Batch 4 functions`);
  const t = sql(`select i.id || '|' || i.name || '|' || (select count(*) from public.academic_periods p where p.institution_id = i.id)
    from public.institutions i where i.slug = ${lit(TUJUAN)} and i.is_active limit 1`);
  if (!harus(rec, !!t, `the receiving school «${TUJUAN}» is active`)) return;
  const [tid, tnama, tahun] = t.split("|");
  harus(rec, Number(tahun) >= 1, `«${tnama}» has ${tahun} school year(s)`);
  for (const [who, slug] of [["admin", SLUG], ["guru", SLUG], ["dekan", SLUG], ["admin", TUJUAN]]) {
    harus(rec, keadaanDari(sql, lit)(mail(who, slug)) !== null, `${who} of ${slug} has an account`);
  }
  harus(rec, keadaanDari(sql, lit)(OPERATOR) !== null, "the Platform Operator has an account");
  for (const n of [STAF_BARU, PINDAH]) {
    const p = orangDari(n);
    harus(rec, !!p && sql(`select kind from public.accounts where person_id = '${uuid(p)}'`) === "CLASSROOM_CARD", `«${n}» holds a class card`);
  }
  if (rec.verdict === "PASS") S = { id: uuid(id), nama, kelas: uuid(kelas) }, T = { id: uuid(tid), nama: tnama };
});
if (!S || !T) { await browser.close(); log("RED: P0"); process.exit(1); }

const O = await (await browser.newContext(konteks())).newPage();
const A = await (await browser.newContext(konteks())).newPage();
const G = await (await browser.newContext(konteks())).newPage();
const B = await (await browser.newContext(konteks())).newPage();
const masuk = async (page, email) => (await masukStaf(page, email, keadaanDari(sql, lit))).di;

// ═══════════════════════════════════════════════════════════════════════════ P1
await step("P1", `the Guru's class page lists «${KELAS}» as a Table, each name opening the record (W3.5, J2Kelas)`, async (rec) => {
  await masuk(G, mail("guru"));
  await pilihKonteks(G, { tujuan: "MENGAJAR", nama: S.nama }).catch(() => {});
  await buka(G, `/mengajar/${S.kelas}`);
  const tabel = G.locator("#pin-kelas-murid");
  await tabel.waitFor({ timeout: SLOW });
  const nama = await tabel.locator('tbody th[scope="row"]').evaluateAll((ths) => ths.map((t) => (t.textContent ?? "").trim()));
  await shot(G, "kelas-tabel");
  harus(rec, MURID.every((n) => nama.includes(n)), `the Table names the five learners (${nama.length} rows)`);
  harus(rec, (await tabel.locator(`tbody th a[href^="/mengajar/${S.kelas}/murid/"]`).count()) === nama.length, "each name links to that learner's record");
});

// ═══════════════════════════════════════════════════════════════════════════ P2
const dekan = orangSurel(mail("dekan"));
const asal = dekan ? sql(`select p.display_name || '|' || coalesce(u.username, '') from public.persons p
  left join public.person_usernames u on u.person_id = p.id where p.id = '${uuid(dekan)}'`).split("|") : ["", ""];
let operatorMasuk = false;
async function koreksi(cari, orang) {
  await buka(O, `/aktivasi/orang?cari=${encodeURIComponent(cari)}`);
  await O.locator(`a[data-koreksi-orang="${orang}"]`).first().click();
  await O.locator("#koreksi").waitFor({ timeout: SLOW });
}
async function koreksiIdentitas(bagian, nilai, alasan, ok) {
  const f = O.locator(`form[data-koreksi="${bagian}"]`);
  await f.locator(`#koreksi-${bagian}`).fill(nilai);
  await f.locator(`#koreksi-${bagian}-alasan`).fill(alasan);
  await f.locator('button[type="submit"]').click();
  await O.getByText(ok).first().waitFor({ timeout: SLOW });
}
await step("P2", "the Platform Operator corrects the Dekan's name and username on «Koreksi data orang» with a reason, audited, then puts both back", async (rec) => {
  if (!dekan || !asal[1]) return terhalang(rec, "the Dekan has no person or username");
  await masuk(O, OPERATOR);
  await pilihKonteks(O, { tujuan: "MENGELOLA", platform: true });
  operatorMasuk = true;
  const sejak = jejakSejak();
  const namaBaru = `${asal[0]} (dikoreksi ${RUN})`;
  const userBaru = `dekan.${RUN}`;
  await koreksi(mail("dekan"), dekan);
  await koreksiIdentitas("nama", namaBaru, "Ejaan nama perlu dibetulkan (uji staging)", "Nama dikoreksi dan dicatat.");
  await shot(O, "koreksi-nama");
  harus(rec, await tunggu(() => sql(`select display_name from public.persons where id = '${uuid(dekan)}'`) === namaBaru), "the name is the corrected one");
  await koreksi(mail("dekan"), dekan);
  await koreksiIdentitas("username", userBaru, "Username lama perlu diganti (uji staging)", "Username dikoreksi dan dicatat.");
  harus(rec, await tunggu(() => sql(`select username from public.person_usernames where person_id = '${uuid(dekan)}'`) === userBaru), "the username is the corrected one");
  harus(rec, jejak(sejak, "identity.name_corrected", dekan) === 1 && jejak(sejak, "identity.username_corrected", dekan) === 1,
    "identity.name_corrected and identity.username_corrected are in the audit log");
  harus(rec, sql(`select summary->>'reason' from public.audit_log where id > ${sejak} and action = 'identity.name_corrected' limit 1`)
    === "Ejaan nama perlu dibetulkan (uji staging)", "the audit row carries the reason");
  // put back, the same way
  await koreksi(mail("dekan"), dekan);
  await koreksiIdentitas("nama", asal[0], "Mengembalikan nama semula (uji staging)", "Nama dikoreksi dan dicatat.");
  await koreksi(mail("dekan"), dekan);
  await koreksiIdentitas("username", asal[1], "Mengembalikan username semula (uji staging)", "Username dikoreksi dan dicatat.");
  harus(rec, await tunggu(() => sql(`select p.display_name || '|' || u.username from public.persons p join public.person_usernames u on u.person_id = p.id
    where p.id = '${uuid(dekan)}'`) === `${asal[0]}|${asal[1]}`), "the Dekan's name and username are as they were");
});

// ═══════════════════════════════════════════════════════════════════════════ P3
const eka = orangDari(STAF_BARU);
let akunEka = eka ? sql(`select id from public.accounts where person_id = '${uuid(eka)}'`) : "";
await step("P3", `the Platform Operator turns «${STAF_BARU}»'s class card into an email account on Aktivasi, with a reason, audited (D-152(a))`, async (rec) => {
  if (!operatorMasuk || !eka) return terhalang(rec, "the Operator is not signed in, or the learner is missing");
  const sejak = jejakSejak();
  await buka(O, `/aktivasi?cari_staf=${encodeURIComponent(STAF_BARU)}`);
  const baris = O.locator(`#jadi-staf li[data-orang="${eka}"]`);
  await baris.waitFor({ timeout: SLOW });
  await baris.getByRole("button", { name: "Ubah menjadi akun email" }).click();
  await baris.locator(`#staf-email-${eka}`).fill(SUREL_STAF);
  await baris.locator(`#staf-alasan-${eka}`).fill("Diangkat menjadi asisten guru (uji staging)");
  await baris.getByRole("button", { name: "Ya, ubah menjadi akun email" }).click();
  await O.locator("#jadi-staf .pin-hasil-ok").waitFor({ timeout: SLOW });
  await shot(O, "kartu-jadi-email");
  const sesudah = sql(`select a.id || '|' || a.kind || '|' || coalesce(a.card_number, '-') || '|' || coalesce((select s.state::text from public.account_setup s where s.account_id = a.id), '-')
    from public.accounts a where a.person_id = '${uuid(eka)}'`);
  harus(rec, sesudah === `${akunEka}|EMAIL|-|REQUIRED`, `the same account row is EMAIL with no card and set-up REQUIRED (${sesudah.split("|").slice(1).join("|")})`);
  harus(rec, jejak(sejak, "account.card_converted_to_email", eka) === 1, "account.card_converted_to_email is in the audit log");
});

// ═══════════════════════════════════════════════════════════════════════════ P4
await step("P4", "the Operator corrects the converted person's address before activation (audited); they activate with the code at the corrected address", async (rec) => {
  if (hasil.at(-1).verdict !== "PASS") return terhalang(rec, "P3 did not convert the card");
  const sejak = jejakSejak();
  await koreksi(SUREL_STAF, eka);
  await O.locator("#koreksi-email").fill(SUREL_BENAR);
  await O.locator("#koreksi-email-alasan").fill("Alamat tertukar dengan rekan (uji staging)");
  await O.getByRole("button", { name: "Koreksi email" }).click();
  await O.getByText(/Email dikoreksi\./).first().waitFor({ timeout: SLOW });
  harus(rec, await tunggu(() => orangSurel(SUREL_BENAR) === eka), "the Auth user carries the corrected address");
  harus(rec, jejak(sejak, "identity.email_corrected", eka) === 1, "identity.email_corrected is in the audit log");
  const E = await (await browser.newContext(konteks())).newPage();
  const di = await masuk(E, SUREL_BENAR);
  await shot(E, "staf-baru-masuk");
  harus(rec, sql(`select s.state::text from public.account_setup s join public.accounts a on a.id = s.account_id where a.person_id = '${uuid(eka)}'`) !== "REQUIRED",
    `the person activated with the emailed code and signed in (at ${di})`);
  harus(rec, sql(`select count(*) from public.accounts where person_id = '${uuid(eka)}' and kind = 'CLASSROOM_CARD'`) === "0",
    "no class card remains, so CR-91 no longer stands between them and a staff role");
});

// ═══════════════════════════════════════════════════════════════════════════ P5, P6
const dimas = orangDari(PINDAH);
let transfer = "";
const identitas = (p) => sql(`select md5(coalesce((select string_agg(ii.institution_id::text || ':' || ii.institutional_id, ',' order by ii.institution_id)
  from public.institutional_identities ii where ii.person_id = '${uuid(p)}'), '') || '|' || coalesce((select pintar_id from public.persons where id = '${uuid(p)}'), '')
  || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.official_results x where x.person_id = '${uuid(p)}'), ''))`);
let identitasSebelum = "";
await step("P5", `the school admin finds «${T.nama}» by its exact name and asks for «${PINDAH}»'s transfer with a reason (W2.15, F-10)`, async (rec) => {
  if (!dimas) return terhalang(rec, "the learner is missing");
  identitasSebelum = identitas(dimas);
  const sejak = jejakSejak();
  await masuk(A, mail("admin"));
  await pilihKonteks(A, { tujuan: "MENGELOLA", nama: S.nama }).catch(() => {});
  await buka(A, `/konfigurasi?bagian=transfers&cari_sekolah=${encodeURIComponent(T.nama)}#transfers`);
  const keluar = A.locator('[data-pindah="keluar"]');
  await keluar.waitFor({ timeout: SLOW });
  harus(rec, (await keluar.locator('input[name="to_institution"]').count()) === 1, `the directory finds exactly one school for «${T.nama}»`);
  const pilihan = await keluar.locator('select[name="from_enrollment"] option').evaluateAll((os) => os.map((o) => [o.value, o.textContent]));
  const nilai = pilihan.find(([, t]) => (t ?? "").includes(PINDAH))?.[0];
  if (!harus(rec, !!nilai, `«${PINDAH}» is offered`)) return;
  await keluar.locator('select[name="from_enrollment"]').selectOption(nilai);
  await keluar.locator('input[name="reason"]').fill("Pindah domisili mengikuti orang tua (uji staging)");
  await keluar.getByRole("button", { name: "Ajukan perpindahan" }).click();
  await tunggu(() => !!sql(`select id from public.transfers where person_id = '${uuid(dimas)}' and status = 'REQUESTED' limit 1`));
  await shot(A, "pindah-minta");
  transfer = sql(`select id from public.transfers where person_id = '${uuid(dimas)}' order by created_at desc limit 1`);
  harus(rec, !!transfer && sql(`select status || '|' || (to_academic_period_id is null)::text from public.transfers where id = '${uuid(transfer)}'`) === "REQUESTED|true",
    "the transfer is REQUESTED, its school year left to the receiving school");
  harus(rec, jejak(sejak, "directory.school_searched") >= 1, "the search is audited (directory.school_searched)");
  harus(rec, !!transfer && jejak(sejak, "transfer.requested", transfer) >= 1, "the request is audited (transfer.requested)");
});
await step("P6", `«${T.nama}»'s admin accepts the request into its own school year and executes it; history kept, audited`, async (rec) => {
  if (!transfer) return terhalang(rec, "no transfer from P5");
  const sejak = jejakSejak();
  await masuk(B, mail("admin", TUJUAN));
  await pilihKonteks(B, { tujuan: "MENGELOLA", nama: T.nama }).catch(() => {});
  await buka(B, "/konfigurasi?bagian=transfers#transfers");
  const masukForm = B.locator(`form[data-pindah-masuk="${transfer}"]`);
  await masukForm.waitFor({ timeout: SLOW });
  harus(rec, norm(await masukForm.innerText()).includes(PINDAH), "the request shows the learner's name");
  const tahun = await masukForm.locator('select[name="to_period"] option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  await masukForm.locator('select[name="to_period"]').selectOption(tahun[0]);
  await masukForm.getByRole("button", { name: "Terima perpindahan" }).click();
  harus(rec, await tunggu(() => sql(`select status from public.transfers where id = '${uuid(transfer)}'`) === "AUTHORIZED"), "accepted: AUTHORIZED into its own year");
  await buka(B, "/konfigurasi?bagian=transfers#transfers");
  const baris = B.locator("#transfers li", { hasText: PINDAH }).first();
  await baris.getByRole("button", { name: "Laksanakan" }).click();
  harus(rec, await tunggu(() => sql(`select status from public.transfers where id = '${uuid(transfer)}'`) === "EXECUTED"), "the transfer is EXECUTED");
  await shot(B, "pindah-laksana");
  harus(rec, sql(`select count(*) from public.enrollments where person_id = '${uuid(dimas)}' and institution_id = '${T.id}' and status = 'ACTIVE'`) === "1",
    `the learner is enrolled at «${T.nama}»`);
  harus(rec, sql(`select count(*) from public.enrollments where person_id = '${uuid(dimas)}' and institution_id = '${S.id}' and status = 'ENDED'`) >= "1"
    && sql(`select count(*) from public.enrollments where person_id = '${uuid(dimas)}' and institution_id = '${S.id}' and status = 'ACTIVE'`) === "0",
    "the sending enrolment is kept as ENDED history");
  harus(rec, identitas(dimas) === identitasSebelum, "the learner's nomor induk, PINTAR ID and official results are unchanged");
  harus(rec, jejak(sejak, "transfer.authorized", transfer) >= 1 && jejak(sejak, "transfer.executed", transfer) >= 1, "transfer.authorized and transfer.executed are audited");
});

// ═══════════════════════════════════════════════════════════════════════════ P7
await step("P7", "what waits on the school's Konfigurasi (UX-33); stuck sends on «Email uji» (W2.19); the schools a page at a time (W2.10)", async (rec) => {
  if (!operatorMasuk) return terhalang(rec, "the Operator is not signed in");
  const nImpor = Number(sql(`select count(*) from public.import_jobs where institution_id = '${S.id}' and state in ('AWAITING_CONFIRMATION', 'AWAITING_PILOT_VERIFICATION')`));
  const nAkun = Number(sql(`select count(*) from public.persons p join public.institutional_identities ii on ii.person_id = p.id
    where ii.institution_id = '${S.id}' and not exists (select 1 from public.accounts a where a.person_id = p.id)`));
  await buka(A, "/konfigurasi");
  const blok = A.locator("[data-menunggu]");
  const ada = (await blok.count()) > 0;
  await shot(A, "menunggu");
  if (nImpor + nAkun > 0) {
    harus(rec, ada, `«Yang menunggu» is shown (${nImpor} import(s), ${nAkun} person(s) waiting)`);
    if (ada && nAkun > 0) harus(rec, (await blok.locator('[data-menunggu-jenis="akun"] a[href="/aktivasi"]').count()) === 1, "the account count opens Aktivasi");
  } else {
    rec.catatan.push(`nothing waits for an import or an account (Studio counts may still show): block ${ada ? "shown" : "not shown"}`);
  }
  await buka(O, "/konfigurasi/email-uji");
  harus(rec, norm(await O.locator("main").innerText()).includes("Pengiriman tertahan"), "«Email uji» shows «Pengiriman tertahan»");
  await shot(O, "email-tertahan");
  await buka(O, "/konfigurasi#system");
  const n = await O.locator("#system li").count();
  const semua = Number(sql("select count(*) from public.institutions"));
  harus(rec, n === Math.min(semua, 20), `the system section lists ${n} of ${semua} schools (a page is 20)`);
});

// ═══════════════════════════════════════════════════════════════════════════ P8
await step("P8", "the school admin adds a profile photo on «Akun saya», sees it, and removes it (W2.8)", async (rec) => {
  const aku = orangSurel(mail("admin"));
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const berkas = join(OUT, "foto.png");
  writeFileSync(berkas, png);
  await buka(A, "/akun#foto");
  await A.locator("#foto-profil").setInputFiles(berkas);
  await A.getByText("Foto profil disimpan.").waitFor({ timeout: SLOW });
  harus(rec, await tunggu(() => sql(`select coalesce(photo_path, '') from public.persons where id = '${uuid(aku)}'`).startsWith(`profile/${aku}/`)),
    "the photo is kept in the person's own folder");
  await buka(A, "/akun#foto");
  const muat = await A.waitForFunction(() => { const i = document.querySelector("img[data-foto-profil]"); return !!i && i.complete && i.naturalWidth > 0; },
    null, { timeout: 15000 }).then(() => true, () => false);
  harus(rec, muat, "the photo shows on «Akun saya»");
  await shot(A, "foto");
  await A.getByRole("button", { name: "Hapus foto" }).click();
  await A.getByText("Foto profil dihapus dari profil Anda.").waitFor({ timeout: SLOW });
  harus(rec, await tunggu(() => sql(`select coalesce(photo_path, '') from public.persons where id = '${uuid(aku)}'`) === ""), "removed: no photo on the profile");
});

// ─────────────────────────────── the record
await browser.close();
const tally = hasil.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {});
writeFileSync(join(OUT, "golden-school-pentadbiran.json"), JSON.stringify({ sekolah: SLUG, tujuan: TUJUAN, run: RUN, hasil }, null, 2));
log(`TALLY ${JSON.stringify(tally)}`);
const merah = hasil.filter((r) => r.verdict !== "PASS");
if (merah.length) { log(`RED: ${merah.map((r) => `${r.id} ${r.verdict}`).join(", ")}`); process.exit(1); }
log("GREEN");

// STAGING ONLY. The Batch 5 journey on deployed staging (D-157, the owner's «Batch 5 Backup Check — CONDITIONAL GO»):
// in a Golden School that GS-01 to GS-21 and the Studio walk have walked (its admin, head of department, Guru, Dekan and
// five learners with official results and certificates exist). Every write is a press of PINTAR's buttons by a person
// signed in through the real screens; the database is only READ (read-only transactions), to assert what was recorded.
//
//   K0  read only: the school, «Kelas 5A», the people, an ISSUED certificate, staging's 193 migrations and the Batch 5
//       functions and table.
//   K1  W2.5 (CR-05, J8.5): the school admin finds the school's certificate on Konfigurasi → «Sertifikat sekolah» by its
//       number, gives a reason, «Lanjutkan» commits nothing and the in-page confirmation starts on «Batal»; «Cabut
//       sertifikat <nomor>» revokes it: REVOKED with the reason, `certificate.revoked` audited with it, the public
//       check DICABUT, the list «Dicabut».
//   K2  W2.7 (CR-75, CR-77): the school admin's «Tinjauan Integritas» renders in Studio with its waiting list and
//       «Sudah ditinjau». An observation is raised only by a learner's own sitting (the player reports it); after GS-16
//       a Golden School learner has no sitting left, and the walk writes nothing to make one, so the per-observation
//       decision and the referrer's outcome are walked where a sitting can be made: CI's journeys (job A B5-W2; job B
//       S23i, S23r). When this school has an observation waiting, the walk decides it here instead.
//   K3  W2.10 (D-153): the Platform Operator, in «Seluruh platform», reads Aktivasi's waiting list a page at a time: at
//       most 20 people, the count, «Berikutnya» when there are more; a search narrows it.
//   K4  W3.8 (RV-11): the Dekan opens «Kelas 5A»'s report: inside the staff shell, naming the school, the class and the
//       school year; printed, no navigation shows.
//   K5  W2.18 (J5.13): the Guru opens each learner's page from «Kelas 5A»: «Tujuan pembelajaran yang belum tercapai» is
//       there for every learner, objectives by statement for the learners under the school's mark, and no identifier.
//
// NEVER production: staging's ref, database URL and origin are checked first. Never Dr Gladys's school: the school
// must be a «sekolah-uji-*» Golden School. A step that cannot run because an earlier one failed is BLOCKED.
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
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^sekolah-uji-[a-z0-9-]{1,30}$/.test(SLUG)) throw new Error(`«${SLUG}» is not a Golden School test slug`);
mkdirSync(join(OUT, "shots"), { recursive: true });

const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const OPERATOR = "goldenschool+operator@pintarselalu.com";
const KELAS = "Kelas 5A";
const RUN = (process.env.GITHUB_RUN_ID ?? String(Date.now())).slice(-6);

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const jejakSejak = () => Number(sql("select coalesce(max(id), 0) from public.audit_log"));
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

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
const konteks = () => ({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(page).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════════ K0
const browser = await chromium.launch();
let S = null;
await step("K0", `read only: «${SLUG}», «${KELAS}», its people, an issued certificate, staging's Batch 5 migrations`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || k.id || '|' || coalesce(ap.name, '') || '|' || (select count(*) from supabase_migrations.schema_migrations) || '|'
      || (to_regprocedure('public.sertifikat_sekolah(uuid,text,integer,uuid)') is not null)::text || '|'
      || (to_regprocedure('public.integrity_reviews_recorded(integer)') is not null)::text || '|'
      || (to_regprocedure('public.persons_awaiting_account_page(uuid,text,integer)') is not null)::text || '|'
      || (to_regprocedure('public.tujuan_belum_tercapai(uuid,uuid)') is not null)::text || '|'
      || (to_regclass('public.result_views') is not null)::text
    from public.institutions i join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
    left join public.academic_periods ap on ap.id = k.academic_period_id
   where i.slug = ${lit(SLUG)} limit 1`);
  if (!harus(rec, !!r, `the school «${SLUG}» with «${KELAS}»`)) return;
  const [id, nama, kelas, tahun, migrasi, ...ada] = r.split("|");
  harus(rec, Number(migrasi) >= 193 && ada.every((x) => x === "true"), `staging holds ${migrasi} migrations and the Batch 5 functions and table (${ada.join(",")})`);
  for (const who of ["admin", "guru", "dekan"]) harus(rec, keadaanDari(sql, lit)(mail(who)) !== null, `the ${who} has an account`);
  harus(rec, keadaanDari(sql, lit)(OPERATOR) !== null, "the Platform Operator has an account");
  const c = sql(`select c.id || '|' || c.certificate_number || '|' || c.verification_token from public.certificates c
     where c.institution_id = '${uuid(id)}' and c.status = 'ISSUED' order by c.certificate_number limit 1`);
  harus(rec, !!c, "the school has an ISSUED certificate (GS-18)");
  const [cid, cnomor, ctoken] = c ? c.split("|") : [];
  if (rec.verdict === "PASS") S = { id: uuid(id), nama, kelas: uuid(kelas), tahun, sert: { id: uuid(cid), nomor: cnomor, token: ctoken } };
});
if (!S) { await browser.close(); log("RED: K0"); process.exit(1); }

const A = await (await browser.newContext(konteks())).newPage();
const O = await (await browser.newContext(konteks())).newPage();
const D = await (await browser.newContext(konteks())).newPage();
const G = await (await browser.newContext(konteks())).newPage();
const masuk = async (page, email) => (await masukStaf(page, email, keadaanDari(sql, lit))).di;
let adminMasuk = false;

// ═══════════════════════════════════════════════════════════════════════════ K1
await step("K1", "W2.5: the school admin revokes the school's certificate on «Sertifikat sekolah», with a reason and the in-page confirmation", async (rec) => {
  await masuk(A, mail("admin"));
  await pilihKonteks(A, { tujuan: "MENGELOLA", nama: S.nama }).catch(() => {});
  adminMasuk = true;
  const { id, nomor, token } = S.sert;
  const sejak = jejakSejak();
  await buka(A, `/konfigurasi/sertifikat?cari=${encodeURIComponent(nomor)}`);
  await shot(A, "sertifikat-daftar");
  const tautan = A.locator(`a[data-cabut-sertifikat="${id}"]`);
  if (!harus(rec, (await tautan.count()) === 1, `«${nomor}» is listed with «Cabut»`)) return;
  await tautan.click();
  await A.locator("#cabut").waitFor({ timeout: SLOW });
  const alasan = `Uji staging Batch 5: dicabut oleh walk ${RUN}`;
  await A.locator("#cabut-alasan").fill(alasan);
  await A.getByRole("button", { name: "Lanjutkan" }).click();
  await A.locator("[data-konfirmasi-cabut]").waitFor({ timeout: SLOW });
  harus(rec, sql(`select status from public.certificates where id = '${id}'`) === "ISSUED", "«Lanjutkan» commits nothing: still ISSUED");
  const fokus = await A.evaluate(() => document.activeElement?.textContent?.trim());
  harus(rec, fokus === "Batal", `focus starts on «Batal» (${fokus})`);
  await shot(A, "sertifikat-konfirmasi");
  await A.getByRole("button", { name: `Cabut sertifikat ${nomor}` }).click();
  await A.getByText(`Sertifikat ${nomor} sudah dicabut`).first().waitFor({ timeout: SLOW });
  await shot(A, "sertifikat-dicabut");
  harus(rec, sql(`select status || '|' || revoked_reason from public.certificates where id = '${id}'`) === `REVOKED|${alasan}`, "the certificate is REVOKED with the reason");
  harus(rec, sql(`select count(*) from public.audit_log where id > ${sejak} and action = 'certificate.revoked' and target_id = '${id}' and summary->>'reason' = ${lit(alasan)}`) === "1",
    "certificate.revoked is audited with the reason");
  harus(rec, sql(`select validity from public.verify_certificate(${lit(token)})`) === "DICABUT", "the public check says DICABUT");
  await buka(A, `/konfigurasi/sertifikat?cari=${encodeURIComponent(nomor)}`);
  harus(rec, /Dicabut/.test(norm(await A.locator("#pin-sertifikat").textContent())), "the list says «Dicabut»");
  harus(rec, !UUID.test(norm(await A.locator("main").textContent())), "no identifier on the screen");
});

// ═══════════════════════════════════════════════════════════════════════════ K2
await step("K2", "W2.7: the school admin's «Tinjauan Integritas»: the waiting list, one decision per observation, «Sudah ditinjau»", async (rec) => {
  if (!adminMasuk) return terhalang(rec, "the school admin did not sign in (K1)");
  const menunggu = sql(`select count(*) from public.integrity_signals g where g.institution_id = '${S.id}'
     and not public.integrity_signal_decided(g.id)`);
  await buka(A, "/studio/integritas");
  const di = new URL(A.url()).pathname;
  if (!harus(rec, di === "/studio/integritas", `the page opens for the school admin (at ${di})`)) return;
  const teks = norm(await A.locator("main").textContent());
  harus(rec, /Tinjauan Integritas/i.test(teks), "the page is «Tinjauan Integritas»");
  harus(rec, (await A.locator("#ditinjau").count()) === 1, "«Sudah ditinjau» is on the page");
  harus(rec, !UUID.test(teks), "no identifier on the screen");
  await shot(A, "integritas");
  if (menunggu === "0") {
    harus(rec, (await A.locator('form[id^="integritas-sinyal-"]').count()) === 0, "with nothing waiting, no decision form is offered");
    rec.catatan.push("no observation waits in this school: one is raised only by a learner's own sitting, and after GS-16 no Golden School "
      + "learner has a sitting left; the per-observation decision and the referrer's outcome are walked in CI (job A B5-W2; job B S23i, S23r)");
    return;
  }
  // an observation waits: decide exactly one (the form's default, NO_CONCERN), and the others stay waiting
  const form = A.locator('form[id^="integritas-sinyal-"]').first();
  const sinyal = (await form.getAttribute("id")).replace("integritas-sinyal-", "");
  const sejak = jejakSejak();
  await form.locator('select[name="keputusan"]').selectOption("NO_CONCERN");
  await form.locator("textarea").first().fill(`Uji staging Batch 5 (${RUN})`).catch(() => {});
  await form.getByRole("button", { name: "Catat tinjauan" }).click();
  await A.waitForLoadState("networkidle");
  await A.waitForTimeout(1500);
  harus(rec, sql(`select count(*) from public.audit_log where id > ${sejak} and action = 'INTEGRITY_SIGNAL_REVIEWED' and summary->>'signal' = ${lit(uuid(sinyal))}`) === "1",
    "the decision is recorded for that one observation");
  harus(rec, sql(`select count(*) from public.integrity_signals g where g.institution_id = '${S.id}' and not public.integrity_signal_decided(g.id)`) === String(Number(menunggu) - 1),
    "exactly the other observations stay waiting");
});

// ═══════════════════════════════════════════════════════════════════════════ K3
await step("K3", "W2.10: the Platform Operator reads Aktivasi's waiting list a page at a time, with the count and a search", async (rec) => {
  await masuk(O, OPERATOR);
  await pilihKonteks(O, { tujuan: "MENGELOLA", platform: true });
  await buka(O, "/aktivasi");
  const jumlahAttr = await O.locator("[data-jumlah-tunggu]").first().getAttribute("data-jumlah-tunggu").catch(() => null);
  const n1 = await O.locator("li.pin-akt-orang").count();
  await shot(O, "aktivasi-halaman-1");
  if (jumlahAttr === null) {
    harus(rec, n1 === 0, `nobody waits on the platform, and none is listed (${n1})`);
    return;
  }
  const jumlah = Number(jumlahAttr);
  harus(rec, n1 <= 20 && n1 === Math.min(20, jumlah), `page 1 draws ${n1} of ${jumlah} waiting (a page is 20)`);
  // E-K2: the pager always draws «Berikutnya»; only a possible move is a real link (rel=next), an impossible one aria-disabled
  const lanjut = O.locator('[data-penomoran] a[data-pager="sesudah"][rel="next"]');
  if (jumlah > 20) {
    if (!harus(rec, (await lanjut.count()) >= 1, "«Berikutnya» is offered")) return;
    await lanjut.first().click();
    await O.waitForURL((u) => u.searchParams.get("hal_tunggu") === "2", { timeout: SLOW });
    await O.waitForLoadState("networkidle");
    const n2 = await O.locator("li.pin-akt-orang").count();
    harus(rec, n2 === Math.min(20, jumlah - 20), `page 2 draws ${n2} more`);
  } else harus(rec, (await lanjut.count()) === 0, "with one page, no «Berikutnya»");
  // a search narrows it: the first name on page 1, by a part of it
  await buka(O, "/aktivasi");
  const pertama = norm(await O.locator("li.pin-akt-orang").first().textContent().catch(() => ""));
  const kata = pertama.split(" ").filter((w) => w.length >= 4)[0];
  if (kata) {
    await O.locator('[data-cari-tunggu] input[type="search"]').fill(kata);
    await O.waitForURL((u) => u.searchParams.get("cari_tunggu") === kata, { timeout: SLOW });
    await O.waitForLoadState("networkidle");
    const semua = await O.locator("li.pin-akt-orang").evaluateAll((ls) => ls.map((l) => l.textContent ?? ""));
    harus(rec, semua.length >= 1 && semua.every((t) => t.toLowerCase().includes(kata.toLowerCase())), `searching «${kata}» lists only matching people (${semua.length})`);
    await shot(O, "aktivasi-cari");
  }
});

// ═══════════════════════════════════════════════════════════════════════════ K4
await step("K4", `W3.8: the Dekan opens «${KELAS}»'s report in the staff shell, named by school, class and year; printed, no navigation`, async (rec) => {
  await masuk(D, mail("dekan"));
  await pilihKonteks(D, { tujuan: "MEMIMPIN", nama: S.nama }).catch(() => {});
  await buka(D, `/edukator/ringkasan?kelas=${S.kelas}`);
  const teks = norm(await D.locator("body").textContent());
  harus(rec, (await D.locator(".pin-shell").count()) > 0, "the report is inside the staff shell");
  harus(rec, teks.includes(S.nama) && teks.includes(KELAS) && (!S.tahun || teks.includes(S.tahun)),
    `the report names «${S.nama}», «${KELAS}»${S.tahun ? ` and «${S.tahun}»` : ""}`);
  harus(rec, /Peserta/.test(teks), "the approved metric word «Peserta» is kept (D-157(a))");
  await shot(D, "laporan-kelas");
  await D.emulateMedia({ media: "print" });
  const nav = await D.evaluate(() => [...document.querySelectorAll("nav, header")].filter((el) => el.offsetParent !== null && getComputedStyle(el).display !== "none").length);
  harus(rec, nav === 0, `printed, no navigation or header shows (${nav})`);
  await shot(D, "laporan-kelas-cetak");
  await D.emulateMedia({ media: "screen" });
});

// ═══════════════════════════════════════════════════════════════════════════ K5
await step("K5", `W2.18: the Guru opens each «${KELAS}» learner's page: «Tujuan pembelajaran yang belum tercapai», by statement, no identifier`, async (rec) => {
  await masuk(G, mail("guru"));
  await pilihKonteks(G, { tujuan: "MENGAJAR", nama: S.nama }).catch(() => {});
  await buka(G, `/mengajar/${S.kelas}`);
  const tautan = await G.locator(`#pin-kelas-murid tbody th a[href^="/mengajar/${S.kelas}/murid/"]`).evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  if (!harus(rec, tautan.length >= 5, `the class page links ${tautan.length} learners`)) return;
  // who is under the school's mark on their latest official Uji Penguasaan (read from the record, not PINTAR's reader)
  const di_bawah = new Set(sql(`select distinct on (s.person_id) s.person_id || '|' || (r.mastery < s.pass_mark)::text
      from public.assessment_sessions s join public.assessment_results r on r.session_id = s.id
     where s.class_node_id = '${S.kelas}' and s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.pass_mark is not null
     order by s.person_id, s.finalized_at desc`).split("\n").filter((l) => l.endsWith("|true")).map((l) => l.split("|")[0]));
  let dengan = 0;
  for (const h of tautan) {
    const orang = /\/murid\/([0-9a-f-]{36})/.exec(h)?.[1];
    await buka(G, h);
    const main = G.locator("main");
    const teks = norm(await main.textContent());
    const ada = /Tujuan pembelajaran yang belum tercapai/.test(teks);
    harus(rec, ada, `«Tujuan pembelajaran yang belum tercapai» on ${orang?.slice(0, 8)}…'s page`);
    harus(rec, !UUID.test(teks), "no identifier on the screen");
    if (orang && di_bawah.has(orang)) {
      const butir = await G.locator("[data-tujuan-belum]").count();
      if (butir >= 1) dengan++;
      rec.catatan.push(`under the mark: ${butir} objective(s) listed`);
    }
    if (dengan === 1 && orang && di_bawah.has(orang)) await shot(G, "guru-murid-tujuan");
  }
  harus(rec, di_bawah.size === 0 || dengan >= 1, `the learners under the mark (${di_bawah.size}) see objectives listed (${dengan})`);
});

await browser.close();
writeFileSync(join(OUT, "golden-school-b5.json"), JSON.stringify({ app: APP, slug: SLUG, run: RUN, hasil }, null, 2));
const n = (v) => hasil.filter((h) => h.verdict === v).length;
log(`\n${n("PASS")}/${hasil.length} PASS, ${n("FAIL")} FAIL, ${n("BLOCKED")} BLOCKED`);
process.exit(n("FAIL") || n("BLOCKED") ? 1 : 0);

// STAGING ONLY. ONE ACCEPTED TRANSFER, EXECUTED BY THE RECEIVING SCHOOL'S «Laksanakan» (owner, 7 Nov: «DIMAS TRANSFER»).
//
// The administration walk's P6 on Sekolah Uji Evaluasi A (run 42352462155) left transfer a0d0ab7e AUTHORIZED: B's
// admin had accepted it into B's «Kelas 5A», and the walk's «Laksanakan» press was lost to a reload race (fixed in
// 6f94df6f). That walk stays recorded as 8/9. This script does only what is left, by the screens, and reads the rest
// back:
//
//   L0  read only: the transfer is AUTHORIZED, from the school of the request to the other school, into an active
//       Kelas of the receiving school; the learner's identity and results fingerprint before the press.
//   L1  the receiving school's admin signs in, opens «Perpindahan murid», presses «Laksanakan» on the learner's row.
//   L2  read back:
//       (1) the learner holds one open placement, the transfer's Kelas at the receiving school, on an ACTIVE enrolment;
//       (2) the sending enrolment is ENDED (TRANSFERRED_OUT) and its placement closed (ENROLLMENT_ENDED);
//       (3) the receiving school's Guru sees the learner on that Kelas's class page;
//       (4) the learner's institutional identities, PINTAR ID and official results are as before;
//       (5) transfer.requested, transfer.authorized and transfer.executed are all in the audit log for the transfer.
//
// The database is only READ (read-only transactions); the one write is the admin's press. NEVER production; both
// schools must be sekolah-uji-* Golden Schools.
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
const TRANSFER = env("GS_LANJUT_PINDAH");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
for (const s of [SLUG, TUJUAN]) if (!/^sekolah-uji-[a-z0-9-]{1,30}$/.test(s)) throw new Error(`«${s}» is not a Golden School test slug`);
if (SLUG === TUJUAN) throw new Error("the receiving school must be another school");
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(TRANSFER)) throw new Error("not a transfer id");
mkdirSync(join(OUT, "shots"), { recursive: true });

const mail = (who, slug) => `goldenschool+${slug}-${who}@pintarselalu.com`;
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const konteks = () => ({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(page).catch(() => {});
}
async function tunggu(cek, kali = 60) {
  for (let i = 0; i < kali; i++) { if (cek()) return true; await new Promise((r) => setTimeout(r, 500)); }
  return cek();
}
const hasil = [];
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
const identitas = (p) => sql(`select md5(coalesce((select string_agg(ii.institution_id::text || ':' || ii.institutional_id, ',' order by ii.institution_id)
  from public.institutional_identities ii where ii.person_id = '${uuid(p)}'), '') || '|' || coalesce((select pintar_id from public.persons where id = '${uuid(p)}'), '')
  || '|' || coalesce((select string_agg(x.id::text, ',' order by x.id) from public.official_results x where x.person_id = '${uuid(p)}'), ''))`);

// ─────────────────────────────── L0
let t = null, sebelum = "";
await step("L0", `read only: transfer ${TRANSFER.slice(0, 8)} is AUTHORIZED from «${SLUG}» into a Kelas of «${TUJUAN}»`, async (rec) => {
  const r = sql(`select t.status || '|' || t.person_id || '|' || t.from_enrollment_id || '|' || coalesce(t.to_node_id::text, '') || '|'
      || coalesce(n.name, '') || '|' || coalesce(n.is_active::text, '') || '|' || p.display_name || '|' || t.from_institution_id || '|' || t.to_institution_id
    from public.transfers t join public.persons p on p.id = t.person_id left join public.org_nodes n on n.id = t.to_node_id
   where t.id = ${lit(TRANSFER)}
     and t.from_institution_id = (select id from public.institutions where slug = ${lit(SLUG)})
     and t.to_institution_id = (select id from public.institutions where slug = ${lit(TUJUAN)})`);
  if (!harus(rec, !!r, `the transfer goes from «${SLUG}» to «${TUJUAN}»`)) return;
  const [status, person, dariEnrol, keNode, keNama, aktif, nama, dari, ke] = r.split("|");
  harus(rec, status === "AUTHORIZED", `it is ${status} (AUTHORIZED: accepted, not yet executed)`);
  harus(rec, !!keNode && aktif === "true", `it names an active place at the receiving school («${keNama}»)`);
  sebelum = identitas(person);
  const kelasAsal = sql(`select string_agg(n.name, ',') from public.memberships m join public.org_nodes n on n.id = m.node_id
    where m.enrollment_id = '${uuid(dariEnrol)}' and m.valid_to is null`);
  rec.catatan.push(`before: «${nama}» placed in «${kelasAsal || "none"}» at «${SLUG}»`);
  if (rec.verdict === "PASS") t = { person: uuid(person), dariEnrol: uuid(dariEnrol), keNode: uuid(keNode), keNama, nama, dari: uuid(dari), ke: uuid(ke) };
});
if (!t) { log("RED: L0"); process.exit(1); }

const browser = await chromium.launch();
const B = await (await browser.newContext(konteks())).newPage();
const masuk = async (page, email) => (await masukStaf(page, email, keadaanDari(sql, lit))).di;

// ─────────────────────────────── L1
await step("L1", `«${TUJUAN}»'s admin presses «Laksanakan» on «${t.nama}»'s row in «Perpindahan murid»`, async (rec) => {
  await masuk(B, mail("admin", TUJUAN));
  await pilihKonteks(B, { tujuan: "MENGELOLA", nama: sql(`select name from public.institutions where id = '${t.ke}'`) }).catch(() => {});
  await buka(B, `/konfigurasi/transfers?bagian=transfers&lanjut=${TRANSFER.slice(0, 8)}#transfers`);
  const baris = B.locator(`#pindah-${TRANSFER}`);
  await baris.waitFor({ timeout: SLOW });
  harus(rec, (await baris.innerText()).includes(t.nama), "the row names the learner");
  await baris.getByRole("button", { name: "Laksanakan" }).click();
  await B.waitForURL((u) => u.searchParams.has("hasil") || u.searchParams.has("kode"), { timeout: SLOW }).catch(() => {});
  await B.waitForLoadState("networkidle");
  harus(rec, await tunggu(() => sql(`select status from public.transfers where id = ${lit(TRANSFER)}`) === "EXECUTED"), "the transfer is EXECUTED");
  await B.screenshot({ path: join(OUT, "shots", "01-laksana.png"), fullPage: true }).catch(() => {});
});

// ─────────────────────────────── L2
await step("L2", "read back: the placement, the ended history, the Guru's class page, the learner's record, the audit trail", async (rec) => {
  const ke = sql(`select count(*) filter (where e.institution_id = '${t.ke}' and e.status = 'ACTIVE' and m.node_id = '${t.keNode}') || '|' || count(*)
    from public.memberships m join public.enrollments e on e.id = m.enrollment_id where e.person_id = '${t.person}' and m.valid_to is null`);
  harus(rec, ke === "1|1", `(1) one open placement, «${t.keNama}» at «${TUJUAN}», on an ACTIVE enrolment (${ke})`);
  const asal = sql(`select e.status || ':' || coalesce(e.end_reason::text, '') || '|' || (select count(*) from public.memberships m where m.enrollment_id = e.id and m.valid_to is null)
      || '|' || coalesce((select string_agg(distinct m.close_reason::text, ',') from public.memberships m where m.enrollment_id = e.id and m.valid_to is not null), '')
    from public.enrollments e where e.id = '${t.dariEnrol}'`);
  const [st, buka0, alasan] = asal.split("|");
  harus(rec, st === "ENDED:TRANSFERRED_OUT" && buka0 === "0" && alasan.includes("ENROLLMENT_ENDED"),
    `(2) the «${SLUG}» enrolment ${st}, open placements ${buka0}, closed as ${alasan || "none"}`);
  const TG = await (await browser.newContext(konteks())).newPage();
  try {
    await masuk(TG, mail("guru", TUJUAN));
    await pilihKonteks(TG, { tujuan: "MENGAJAR", nama: sql(`select name from public.institutions where id = '${t.ke}'`) }).catch(() => {});
    await buka(TG, `/mengajar/${t.keNode}`);
    const tabel = TG.locator("#pin-kelas-murid");
    await tabel.waitFor({ timeout: SLOW });
    const nama = await tabel.locator('tbody th[scope="row"]').evaluateAll((ths) => ths.map((x) => (x.textContent ?? "").trim()));
    await TG.screenshot({ path: join(OUT, "shots", "02-kelas-tujuan.png"), fullPage: true }).catch(() => {});
    harus(rec, nama.includes(t.nama), `(3) «${TUJUAN}»'s Guru sees «${t.nama}» on «${t.keNama}»'s class page (${nama.length} learner(s))`);
  } finally { await TG.context().close(); }
  harus(rec, identitas(t.person) === sebelum, "(4) the learner's institutional identities, PINTAR ID and official results are unchanged");
  const aksi = sql(`select string_agg(distinct action, ',' order by action) from public.audit_log where target_id = ${lit(TRANSFER)}`);
  harus(rec, ["transfer.authorized", "transfer.executed", "transfer.requested"].every((a) => aksi.split(",").includes(a)),
    `(5) the audit trail for the transfer: ${aksi}`);
});

await browser.close();
writeFileSync(join(OUT, "golden-school-pindah-lanjut.json"), JSON.stringify({ sekolah: SLUG, tujuan: TUJUAN, transfer: TRANSFER, hasil }, null, 2));
const merah = hasil.filter((r) => r.verdict !== "PASS");
log(`TALLY ${JSON.stringify(hasil.reduce((a, r) => ({ ...a, [r.verdict]: (a[r.verdict] ?? 0) + 1 }), {}))}`);
if (merah.length) { log(`RED: ${merah.map((r) => r.id).join(", ")}`); process.exit(1); }
log("GREEN");

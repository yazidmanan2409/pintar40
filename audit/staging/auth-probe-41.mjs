// STAGING ONLY. Part 2's hosted Auth probe (Sharon, PART2-EVIDENCE-RULING.md, rows 6(b) and 2): on ONE synthetic
// learner L at ONE «sekolah-uji-*» school, through PINTAR's own paths:
//   P0  the school admin (SA) and the Platform Operator (PA) sign in with their password, as a person does. No
//       recovery: if a password is not accepted, the run stops and says so.
//   P1  the audit rows of those sign-ins carry the dispatched commit (build_sha).
//   P2  SA rosters L into the class; L has no account.
//   P3  PA suspends L, who still has no account.
//   P4  SA gives L a class card through the app; L's new account is locked at its first read.
//   P5  ONE sign-in with the card's right PIN: refused with the ordinary mismatch (401 CARD_NOT_MATCHED, the one answer
//       the card contract gives for "card or PIN did not match, or the card cannot sign in", src/lib/kartu-kontrak.ts).
//   P6  PA reinstates L; the account reads released.
//   P7  L signs in with the card (the clean-up's first act needs L's own session); the sign-in records' network origin.
//   P8  the clean-up through the product: SA ends L's enrolment; L asks for deletion and closes the account; PA deletes
//       L's personal data. L is anonymised, closed and terminal.
//   P9  the audit rows written since P0 still carry the dispatched commit.
// Printed: ids, yes/no facts, build_sha and network_origin. Never a secret, a card number, a PIN or a token.
//
// THE ONE EXIT. A step that differs, a hosted rate limit (RETRY), an error outside a step, SIGINT and SIGTERM all end
// here. Once a stop has begun, every act refuses except the clean-up's own, and the clean-up waits (10 s at most) for
// the step in flight. The clean-up, read from staging, not from memory:
//   * any suspension this run opened and has not ended is ended (aktifkan_kembali_akun, with PA's session);
//   * if L exists and is not anonymised, L is removed through the product as far as it can be (P8's acts); each act's
//     outcome is recorded, and what is left is printed by id.
// A kill cannot be caught: the workflow's always() step then reports, by id, any suspension of this run left open and
// L's state.
//
// NEVER production: staging's ref, database URL and origin are checked first. Only a «sekolah-uji-*» school.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { APP, SLOW } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const LOCAL = process.env.PROBE_LOCAL === "1";
const SLUG_UJI = /^sekolah-uji-[a-z0-9-]{1,30}$/;   // the walks' own pattern; «sekolah-demo-pintar» does not match
const GS_SLUG = process.env.GS_SLUG;
if (!LOCAL || GS_SLUG !== undefined) {
  if (!SLUG_UJI.test(GS_SLUG ?? "")) throw new Error(`«${GS_SLUG ?? ""}» is not a Golden School test school (sekolah-uji-*): the probe does not start`);
}
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
if (LOCAL) {
  if (![DB, SB, APP].every((u) => /127\.0\.0\.1|localhost/.test(u))) throw new Error("PROBE_LOCAL runs only against a local stack");
} else if (REF === PRODUCTION_REF || !DB.includes(REF) || DB.includes(PRODUCTION_REF) || !SB.includes(REF)
    || !/^https:\/\/staging\.pintarselalu\.com$/.test(APP)) {
  throw new Error("not staging");
}
const BUILD = env("PROBE_BUILD");
if (!/^[0-9a-f]{40}$/.test(BUILD)) throw new Error("PROBE_BUILD is not a 40-character commit");
const KELAS = env("GS_KELAS");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
const RUN = (process.env.GITHUB_RUN_ID ?? String(Date.now())).slice(-6);
const SA_EMAIL = LOCAL ? env("LOCAL_ADMIN_EMAIL") : `goldenschool+${GS_SLUG}-admin@pintarselalu.com`;
const PA_EMAIL = LOCAL ? env("LOCAL_OPERATOR_EMAIL") : env("OPERATOR_EMAIL");
// a name the roster accepts (letters only), this run's alone; the workflow's always() step derives the same name
const L_NAMA = `Sintetis Probe Auth ${[...RUN].map((d) => "abcdefghij"[Number(d)]).join("")}`;
const CATATAN = `Probe Auth staging 4.1 (run ${RUN}): akun sintetis`;
const TERKUNCI = "2999-12-31 23:59:59+00";
mkdirSync(OUT, { recursive: true });

// ── the record: every line logged or saved passes through bersih()
const hasil = { run: process.env.GITHUB_RUN_ID ?? "local", started: new Date().toISOString(), build: BUILD, steps: [], ids: {}, undo: [] };
const RAHASIA = /(access_token|refresh_token|token|api_?key|apikey|secret|password|pin|card|kartu|cookie|authorization)/i;
const bersih = (x) => String(x)
  .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "«redacted»")
  .replace(/"([A-Za-z_]+)"\s*:\s*("(?:[^"\\]|\\.)*"|\d+)/g, (m, k) => (RAHASIA.test(k) ? `"${k}":"«redacted»"` : m));
const log = (s) => { const b = bersih(s); console.log(b); if (SUMMARY) appendFileSync(SUMMARY, `${b}\n`); };
const simpan = () => writeFileSync(join(OUT, "auth-probe-41.json"), bersih(JSON.stringify(hasil, null, 2)));
const tutupi = (s) => { if (s) console.log(`::add-mask::${s}`); return s; };
class Beda extends Error {}
class Batas extends Error {}
class Henti extends Error {}
const harus = (ok, pesan) => { if (!ok) throw new Beda(pesan); };
const BATAS = /over_[a-z_]*rate_limit|rate_limit|too_many_requests/i;
const periksaBatas = (status, body, apa) => {
  const kode = body && typeof body === "object" ? String(body.error_code ?? body.code ?? body.error ?? "") : String(body ?? "");
  if (status === 429 || BATAS.test(kode)) throw new Batas(`${apa}: a hosted rate limit answered (${status} ${kode.slice(0, 80)})`);
};
const PAKSA = LOCAL ? (process.env.PROBE_PAKSA ?? "") : "";   // the engineer's local forced failures; never on staging
const paksa = (titik) => { if (PAKSA.split(",").includes(titik)) throw new Beda(`forced failure at ${titik} (local test)`); };

// ── the database: reads in read-only transactions; the probe writes nothing directly
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const baca = (q) => execFileSync("psql", [DB, "-qAtX", "-v", "ON_ERROR_STOP=1", "-c", "begin transaction read only", "-c", q, "-c", "commit"],
  { encoding: "utf8" }).trim();

// ── the stop, and its gate
let selesaiSudah = false, berjalan = null, keluar = null;
const pembersih = new AsyncLocalStorage();
const gerbang = (apa) => { if (selesaiSudah && !pembersih.getStore()) throw new Henti(`a stop has begun: ${apa} not sent`); };

async function langkah(id, judul, fn) {
  if (selesaiSudah) return keluar;
  const t0 = Date.now();
  try {
    berjalan = fn();
    const r = (await berjalan) ?? {};
    hasil.steps.push({ id, judul, verdict: "PASS", detail: r.detail ?? "", ms: Date.now() - t0 });
    log(`PASS      ${id}  ${judul} :: ${r.detail ?? ""}`);
    simpan();
  } catch (e) {
    const detail = String(e?.message ?? e).split("\n")[0].slice(0, 400);
    if (selesaiSudah) {   // the stop's own effect on a step in flight: not a result
      hasil.steps.push({ id, judul, verdict: "INTERRUPTED", detail, ms: Date.now() - t0 });
      log(`INTERRUPTED ${id}  ${judul} :: ${detail}`); simpan();
      return keluar;
    }
    const batas = e instanceof Batas || /rate limit|too many requests|\b429\b/i.test(detail);
    const v = batas ? "RETRY" : "DIFFERS";
    hasil.steps.push({ id, judul, verdict: v, detail, ms: Date.now() - t0 });
    hasil.stopped = id;
    log(`${v.padEnd(9)} ${id}  ${judul} :: ${detail}`);
    log(batas ? `STOPPED at ${id} by a hosted rate limit: not a result; dispatch again later.` : `STOPPED at ${id}: a result differs. Hold.`);
    simpan();
    await selesai(1);
  }
}

// ── the actors: a browser context each, signed in as a person signs in
let browser, SA = null, PA = null, L = null;
const konteks = () => browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
async function token(ctx) {
  const c = (await ctx.cookies()).filter((x) => /^sb-[a-z0-9]+-auth-token(\.\d+)?$/.test(x.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  if (!c.length) throw new Error("no session cookie");
  const j = JSON.parse(Buffer.from(c.map((x) => x.value).join("").replace(/^base64-/, ""), "base64url").toString("utf8"));
  tutupi(j.access_token); tutupi(j.refresh_token);
  return j;
}
/** A database function a screen calls, with the actor's own session (PA's is kept for the clean-up). */
async function fungsi(akt, nama, args) {
  gerbang(nama);
  let t = akt.sesi;
  if (akt.ctx) { try { t = await token(akt.ctx); akt.sesi = t; } catch (e) { if (!t) throw e; } }
  if (!t?.access_token) throw new Error("no session to act with");
  const r = await fetch(`${SB}/rest/v1/rpc/${nama}`, {
    method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const teks = await r.text();
  let body; try { body = JSON.parse(teks); } catch { body = teks; }
  periksaBatas(r.status, body, nama);
  return { status: r.status, body };
}
/** One of the app's own routes, from the actor's browser (same origin, its cookies). */
async function rute(ctx, path, { json, form } = {}) {
  gerbang(path);
  const r = await ctx.request.post(`${APP}${path}`, { headers: { Origin: APP, ...(LOCAL ? { "x-real-ip": "203.0.113.7" } : {}) },
    data: json, form, maxRedirects: 0, timeout: SLOW });
  const teks = await r.text();
  let body; try { body = JSON.parse(teks); } catch { body = teks; }
  periksaBatas(r.status(), body, path);
  return { status: r.status(), body, location: r.headers()["location"] ?? null };
}
/** A staff sign-in with the password and nothing else: no activation, no «Lupa password?». */
async function masuk(email, { platform = false }) {
  gerbang("a sign-in");
  const m = await import("./masuk.mjs");
  // the walks' derivation on staging (masuk.mjs); the seed's synthetic passwords locally
  const k = LOCAL ? { password: tutupi(env(email === SA_EMAIL ? "LOCAL_ADMIN_PASSWORD" : "LOCAL_OPERATOR_PASSWORD")), pin: "", username: "" }
    : m.kredensial(email);
  const ctx = await konteks();
  const page = await ctx.newPage();
  harus(await m.denganPassword(page, email, k.password),
    `${email === SA_EMAIL ? "SA" : "PA"}'s password was not accepted. No recovery is attempted: the probe stops`);
  await m.selesaikan(page, k);
  if (platform) {
    await page.goto(`${APP}/`, { timeout: SLOW, waitUntil: "networkidle" });
    if (await page.locator('[data-pemilih="konteks"]').count()) await m.pilihKonteks(page, { tujuan: "MENGELOLA", platform: true });
  }
  return { ctx, page, sesi: await token(ctx) };
}
const masukKartu = (ctx, kartu, pin) => rute(ctx, "/masuk/kartu", { form: { kartu, pin } });
const jawaban = (a) => JSON.stringify({ status: a.status, body: typeof a.body === "object" && a.body ? Object.fromEntries(Object.entries(a.body).filter(([k]) => k !== "ref")) : a.body });

// ── L's state, read from staging
const lUser = () => baca(`select coalesce((select a.auth_user_id::text from public.accounts a where a.person_id = ${lit(hasil.ids.L)} order by a.id limit 1), '')`);
const lKunci = () => { const u = lUser(); return u ? baca(`select coalesce(banned_until::text, 'null') from auth.users where id = ${lit(u)}`) : "(no account)"; };
const bukaDariRun = (orang) => baca(`select count(*) from public.person_suspensions where person_id = ${lit(orang)} and ended_at is null and note = ${lit(CATATAN)}`);
const keadaanL = () => baca(`select 'anonymised ' || (p.anonymized_at is not null) || ', account ' || (select count(*) from public.accounts a where a.person_id = p.id)
    || ', enrolment ' || coalesce((select string_agg(e.status::text, ',') from public.enrollments e where e.person_id = p.id), '-')
    || ', open suspensions ' || (select count(*) from public.person_suspensions s where s.person_id = p.id and s.ended_at is null)
    || ' (this run''s: ' || (select count(*) from public.person_suspensions s where s.person_id = p.id and s.ended_at is null and s.note = ${lit(CATATAN)}) || ')'
    from public.persons p where p.id = ${lit(hasil.ids.L)}`);

// ── P8's acts, shared by the normal path and the clean-up
let kartu = null, pin = null, permintaan = null;
const dihapus = { enrolment: false, diminta: false, data: false };
async function akhiriPendaftaran() {
  if (dihapus.enrolment) return "enrolment already ended";
  const enr = baca(`select coalesce((select id::text from public.enrollments where person_id = ${lit(hasil.ids.L)} and status in ('PENDING', 'ACTIVE') limit 1), '')`);
  if (enr) {
    const r = await fungsi(SA, "akhiri_pendaftaran", { p_enrollment: enr, p_reason: "OTHER",
      p_explanation: "Probe staging 4.1: murid sintetis", p_effective: new Date().toISOString().slice(0, 10) });
    harus(r.status < 300, `akhiri_pendaftaran answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  }
  dihapus.enrolment = true;
  return `enrolment ${baca(`select coalesce(string_agg(status::text, ','), '-') from public.enrollments where person_id = ${lit(hasil.ids.L)}`)}`;
}
async function mintaHapusDanTutup() {
  if (dihapus.diminta) return "already requested";
  if (!L) {
    harus(kartu && pin, "L has no card to sign in with");
    const c = await konteks();
    const r = await masukKartu(c, kartu, pin);
    harus(r.status === 200 && r.body?.ok, `L's card sign-in answered ${jawaban(r)}`);
    L = { ctx: c };
  }
  const d = await fungsi(L, "minta_akun", { p_kind: "DELETE_PERSONAL_DATA", p_konfirmasi: true });
  harus(d.status < 300 && d.body?.ok, `the deletion request answered ${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
  permintaan = d.body.permintaan; hasil.ids.request = permintaan;
  const c = await fungsi(L, "minta_akun", { p_kind: "CLOSE", p_konfirmasi: true });
  harus(c.status < 300 && c.body?.ok, `the closure answered ${c.status} ${JSON.stringify(c.body).slice(0, 200)}`);
  dihapus.diminta = true;
  return baca(`select string_agg(kind || ' ' || status, ', ' order by kind) from public.account_requests where person_id = ${lit(hasil.ids.L)}`);
}
async function hapusData() {
  if (dihapus.data) return "already deleted";
  harus(permintaan, "no deletion request to act on");
  const r = await rute(PA.ctx, "/api/akun/hapus-data", { form: { permintaan, catatan: "Probe staging 4.1: orang sintetis" } });
  harus(r.status === 303 && !/gagal/.test(r.location ?? ""), `the deletion answered ${r.status} → ${r.location}`);
  dihapus.data = true;
  return keadaanL();
}

// ── THE ONE EXIT: undo what this run left, read from staging; then print what is left
async function rapikan() {
  const catat = (apa, ok, teks) => { hasil.undo.push({ apa, ok, hasil: teks }); log(`UNDO      ${apa} :: ${teks}`); };
  if (!hasil.ids.L) { simpan(); return; }
  try {
    if (bukaDariRun(hasil.ids.L) !== "0") {
      if (!PA?.sesi) throw new Error("PA has no session to reinstate with");
      paksa("undo");
      const r = await fungsi({ sesi: PA.sesi }, "aktifkan_kembali_akun", { p_person: hasil.ids.L, p_alasan: `Probe staging 4.1 berhenti; dipulihkan oleh run ${RUN}` });
      const sisa = bukaDariRun(hasil.ids.L);
      catat("L reinstated", r.status < 300 && sisa === "0", r.status < 300 && sisa === "0" ? "no suspension of this run left open" : `FAILED: ${r.status}, ${sisa} left open; the owner's`);
    }
  } catch (e) { catat("L reinstated", false, `FAILED: ${String(e?.message ?? e).split("\n")[0].slice(0, 200)}; the owner's`); }
  // L removed through the product, as far as it can be
  if (!dihapus.data && baca(`select (anonymized_at is null) from public.persons where id = ${lit(hasil.ids.L)}`) === "t") {
    for (const [apa, fn] of [["L's enrolment ended", akhiriPendaftaran], ["L's deletion and closure requested", mintaHapusDanTutup], ["L's personal data deleted", hapusData]]) {
      try { catat(apa, true, await fn()); } catch (e) { catat(apa, false, `FAILED: ${String(e?.message ?? e).split("\n")[0].slice(0, 200)}`); break; }
    }
  }
  hasil.tertinggal = `L ${hasil.ids.L}: ${keadaanL()}`;
  log(`LEFT      ${hasil.tertinggal}`);
  simpan();
}
function selesai(kode) {
  if (keluar) return keluar;
  selesaiSudah = true;
  keluar = (async () => {
    await Promise.race([Promise.resolve(berjalan).catch(() => {}), new Promise((r) => setTimeout(r, 10000))]);
    await pembersih.run(true, () => rapikan()).catch((e) => { hasil.undo.push({ apa: "the clean-up", ok: false, hasil: `FAILED: ${String(e?.message ?? e).slice(0, 200)}` }); simpan(); });
    await browser?.close().catch(() => {});
    process.exit(kode);
  })();
  return keluar;
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { hasil.stopped ??= `(${sig})`; log(`STOPPED by ${sig}: the clean-up runs`); simpan(); void selesai(1); });
for (const ev of ["unhandledRejection", "uncaughtException"]) process.on(ev, (e) => { hasil.stopped ??= "(outside a step)"; log(`STOPPED outside a step: ${String(e?.message ?? e).split("\n")[0].slice(0, 300)}`); simpan(); void selesai(1); });

// ── the build. The app stamps its build on the audit rows it writes (its x-pintar-build header). A database function
// the probe calls directly (PostgREST, as a screen's own call would reach it: suspend, reinstate, end the enrolment)
// writes its row without the app, so with no build: those rows are listed by action, never counted as the app's.
const tandaAudit = () => baca(`select coalesce(max(id), 0) from public.audit_log`);
function buildSejak(sejak, orang) {
  const dari = `from public.audit_log where id > ${Number(sejak)} and actor_person_id in (${orang.map(lit).join(", ")})`;
  const app = baca(`select coalesce(string_agg(distinct build_sha, ' '), '') ${dari} and build_sha is not null`);
  harus(app !== "", "no audit row was written through the app by the actors since the mark, so the app's build cannot be read");
  harus(app === BUILD, `the app's audit rows carry build ${app}, not the dispatched commit ${BUILD}`);
  const n = baca(`select count(*) ${dari} and build_sha is not null`);
  const tanpa = baca(`select coalesce(string_agg(action, ', ' order by id), '') ${dari} and build_sha is null`);
  return `the app's ${n} audit row(s) carry build_sha ${BUILD}${tanpa ? `; written by a direct function call, with no build: ${tanpa}` : ""}`;
}

// ════════════════════════════════════════════════════════════════════════════════════════════ the probe
browser = await chromium.launch({ handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
const tanda0 = tandaAudit();
let aktor = [];
await langkah("P0", "SA, then PA in «Seluruh platform», sign in with their password (no recovery)", async () => {
  SA = await masuk(SA_EMAIL, {});
  PA = await masuk(PA_EMAIL, { platform: true });
  aktor = baca(`select string_agg(a.person_id::text, ' ') from public.accounts a join auth.users u on u.id = a.auth_user_id
      where lower(u.email) in (lower(${lit(SA_EMAIL)}), lower(${lit(PA_EMAIL)}))`).split(" ").filter(Boolean);
  hasil.ids.SA_PA = aktor;
  return { detail: "both by the password" };
});
await langkah("P1", "the app serving staging is the dispatched commit", async () => ({ detail: buildSejak(tanda0, aktor) }));
await langkah("P2", `SA rosters L into «${KELAS}» through /pendataan; L has no account`, async () => {
  const { catat } = await import("./pendataan.mjs");
  await SA.page.goto(`${APP}/pendataan`, { timeout: SLOW });
  await catat(SA.page, [L_NAMA], { kelas: KELAS });
  const r = baca(`select p.id || ' ' || (select count(*) from public.accounts a where a.person_id = p.id)
      from public.persons p where p.display_name = ${lit(L_NAMA)}`);
  const [id, n] = r.split(" ");
  harus(r.split("\n").length === 1 && id, `the roster gave: ${r || "no person"}`);
  hasil.ids.L = id;
  harus(n === "0", `L has ${n} account(s)`);
  return { detail: `L ${id}; account 0` };
});
await langkah("P3", "PA suspends L, who has no account", async () => {
  const r = await fungsi(PA, "tangguhkan_akun", { p_person: hasil.ids.L, p_kategori: "ADMINISTRATIVE", p_catatan: CATATAN });
  harus(r.status < 300, `tangguhkan_akun answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  harus(bukaDariRun(hasil.ids.L) === "1", "no open suspension of this run");
  return { detail: "suspended: yes; account 0" };
});
await langkah("P4", "SA gives L a class card through the app; the account is locked at its first read", async () => {
  const r = await rute(SA.ctx, "/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: hasil.ids.L } });
  harus(r.status === 200 && r.body?.ok && r.body?.card, `the activation answered ${r.status} ${String(r.body?.error ?? r.body?.code ?? "(no code)")}`);
  kartu = tutupi(String(r.body.card)); pin = tutupi(String(r.body.pin));
  const k = lKunci();
  hasil.ids.L_user = lUser();
  harus(k === TERKUNCI, `L's new account, first read: banned_until ${k} (an open account is a material discrepancy)`);
  paksa("P4");
  return { detail: `account 1; locked at the first read: yes (banned_until ${k})` };
});
await langkah("P5", "ONE sign-in with the card's right PIN while locked: refused with the ordinary mismatch", async () => {
  const c = await konteks();
  const r = await masukKartu(c, kartu, pin);
  await c.close();
  harus(jawaban(r) === JSON.stringify({ status: 401, body: { ok: false, code: "CARD_NOT_MATCHED" } }),
    `the locked card's right PIN answered ${jawaban(r)}, not the ordinary mismatch`);
  harus(lKunci() === TERKUNCI, "L is no longer locked after the attempt");
  return { detail: "refused: yes, 401 CARD_NOT_MATCHED; still locked: yes" };
});
await langkah("P6", "PA reinstates L; the account reads released", async () => {
  const r = await fungsi(PA, "aktifkan_kembali_akun", { p_person: hasil.ids.L, p_alasan: "Probe staging 4.1 selesai untuk langkah ini" });
  harus(r.status < 300, `aktifkan_kembali_akun answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  harus(bukaDariRun(hasil.ids.L) === "0", "a suspension of this run is still open");
  const k = lKunci();
  harus(k === "null", `after reinstatement banned_until ${k}`);
  return { detail: "released: yes (banned_until null)" };
});
await langkah("P7", "L signs in with the card (for the clean-up); the sign-in records carry a network origin", async () => {
  const c = await konteks();
  const r = await masukKartu(c, kartu, pin);
  harus(r.status === 200 && r.body?.ok, `L's card sign-in answered ${jawaban(r)}`);
  L = { ctx: c };
  const o = baca(`select string_agg(kind || ' ' || coalesce(network_origin, '-'), ', ' order by at) from public.accountability_events
      where person_id = ${lit(hasil.ids.L)}`);
  harus(/SIGN_IN_OK \S+\/(24|48)\b/.test(o ?? ""), `L's sign-in records read ${o || "none"}`);
  hasil.network_origin = o;
  return { detail: `signed in: yes; records: ${o}` };
});
await langkah("P8", "the clean-up through the product: enrolment ended, deletion and closure requested, personal data deleted", async () => {
  const a = await akhiriPendaftaran();
  const b = await mintaHapusDanTutup();
  const c = await hapusData();
  harus(/^anonymised true, account 1, enrolment [A-Z_]+, open suspensions 1 \(this run's: 0\)$/.test(c) && !/PENDING|ACTIVE/.test(c), `L reads ${c}`);
  return { detail: `${a}; ${b}; ${c}` };
});
await langkah("P9", "the app's audit rows written since P0 still carry the dispatched commit", async () => ({ detail: buildSejak(tanda0, aktor) }));

hasil.finished = new Date().toISOString();
log(`ALL STEPS DONE: ${hasil.steps.filter((s) => s.verdict === "PASS").length} PASS. L ${hasil.ids.L} is anonymised, closed and terminal.`);
simpan();
await selesai(0);

// STAGING ONLY. The Golden School after its students (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5): what the staff
// read, the certificate, and its public check. After golden-school-murid.mjs (GS-12 to GS-16) has put five official
// results into «Kelas 5A».
//
//   L0  read only: the school GS_SLUG, «Kelas 5A», its chapter, and what the figures must say, computed here from the
//       raw official results (assessment_results), not from PINTAR's calculators: participants, comprehension (the
//       mean post-test mastery), net gain (post − pre, per learner with both), the readiness tiers, each student's
//       mastery against the sealed mark, and the certificates the school has issued.
//   L1  GS-17, the teacher (J7.1, J7.2): signs in with their password (masuk.mjs) → Mengajar → «Kelas 5A» → «Lihat bukti»: the
//       day's counts and the class's conclusions equal L0's; each student's «Hasil resmi» shows their mastery and
//       whether it is under the school's target. Scope: another school's class is refused; /pimpinan is refused; the
//       school's summary shows the teacher no school figure.
//   L2  GS-17, the head of department (J7.3): signs in → /pimpinan → «Per kelas» → «Kelas 5A»: the same figures. Scope:
//       no school figures and no «Buka ringkasan sekolah»; the school's root and another school's node are refused.
//   L3  GS-17, the dean (J7.4): signs in (the dean's first sign-in) → /pimpinan: the school's figures; «Kelas 5A» the
//       same as above; «Buka ringkasan sekolah»: «Sertifikat terbit» equals the certificates issued. Scope: another
//       school's root is refused; its summary shows the dean nothing.
//   L4  GS-17, the school admin (J7.4): signs in → Konfigurasi → «Laporan»: the school summary and «Kelas 5A»'s summary
//       say the same as the dean and the teacher. Scope: /pimpinan is refused (by design); another school's class
//       summary shows nothing.
//   C1  GS-18 (J8.1, J8.2), read only: eligibility computed here (official, a sealed mark, the safety gate, mastery at
//       or above the mark) against what was issued: exactly one ISSUED certificate per eligible student, on their
//       Uji Penguasaan, none for the others and none for a Pemetaan Awal; numbers in sequence; the name as issued.
//   R1  GS-21 (J2.21): the school admin signs in → Aktivasi → «Kartu hilang atau rusak»: the primary student's card
//       is re-issued as lost and Bunga's as damaged, each by «Terbitkan kartu baru», the reason and «Ya, terbitkan
//       kartu baru»; the walk reads each new card from its sheet (never printed). Read back: the account's card is
//       the new one, `account.card_reissued` says why, the results stay, and no session of the old card is open
//       (D-101(3)). This is how the students sign in again: a card's PIN is shown once (golden-school-murid.mjs).
//   C2  GS-18 (J8.3): on the class computer, the holder signs in with the new card → «Sertifikat» → the chapter:
//       «Sertifikat Penguasaan», its number, the name as issued and the verification link, equal to the record.
//   U1  GS-20 (J2.9, J2.20), the same class computer: the holder opens a lesson past its first page; 5 minutes
//       without touching anything and the screen goes to «PINTAR terkunci» (no name, no question about the
//       computer); the new card's PIN resumes the lesson at the same page. Idle again: «Bukan akun Anda?» → «Keluar»;
//       her lesson's address now asks for a sign-in. Bunga signs in on the same browser: her own session, the same
//       lesson at its first page. She signs out. Two real 5-minute waits: nothing is shortened or simulated.
//   C3  GS-18: staff never open a certificate; the teacher's browser at the holder's certificate page shows none.
//   R2  GS-21 (J2.11): the teacher, on another browser, «Lupa password?» → the emailed code → a new password; the
//       browser of L1 is signed out (D-101(3)); the teacher reads their PINTAR ID on «Akun saya».
//   R3  GS-21 (J2.12): on a third browser, «Lupa password?» → «Pakai PINTAR ID dan PIN» with that ID and the PIN set
//       at activation → a new password; R2's browser is signed out. The teacher then signs out.
//   V1  GS-19 (J8.6): an anonymous visitor (a fresh browser, no sign-in) opens each issued certificate's verification
//       link, as the certificate page builds it (<app>/verifikasi/<token>): «Berlaku», the result, the school, the
//       date; never the holder's name. The holder's link is the one C2 read on her page; the others, from the record.
//   V2  GS-19: a random and a malformed code give the private not-found and reveal nothing; the endpoint says 404.
//   X1  GS-20, everyone signs out, read only: every session this run opened is ended (by «Keluar», or by the
//       credential's replacement), none left open.
//
// NEVER: production; a direct write (the database is read in read-only transactions; every write is a press of
// PINTAR's buttons); a server-made session as a person's act; a card number, PIN or password in the log. The walk
// changes two cards and the teacher's password, as their owners' journeys do; a later run signs the teacher in again
// by «Lupa password?» (masuk.mjs).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, kredensial, masukStaf, pulihkanDenganEmail, pulihkanDenganPin, selesaikan, tutupi } from "./masuk.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
mkdirSync(join(OUT, "shots"), { recursive: true });

// the recipe (§4), as golden-school-admin.mjs made it
const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const KELAS = "Kelas 5A", BAGIAN = "Kelas Tinggi";
const BAB = "Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000";
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
const SEKOLAH_LAIN = "Sekolah Uji Kinerja (sintetis)";

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
// a figure as PINTAR writes it (src/lib/nilai-metrik.ts, format.percent): the walk's own arithmetic, the page's words
const PERSEN = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 0 });
const ANGKA = new Intl.NumberFormat("id-ID");
const persen = (v) => PERSEN.format(v);
const poin = (v) => { const p = Math.round(v * 100); return `${p > 0 ? "+" : ""}${ANGKA.format(p)} poin`; };
// PINTAR's fixed performance bands (D-095, 3 Oct): band words in band order, never certificate readiness
const TIER = { siap: "Mantap", review: "Berkembang", dampingi: "Perlu penguatan" };
const PITA = "Sebaran hasil Uji Penguasaan";

const results = [];
let shotN = 0;
async function shot(page, name) {
  const f = join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  return f;
}
async function step(id, title, fn) {
  const rec = { verdict: "PASS" };
  let detail;
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n")[0].slice(0, 300); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(7)} ${id}  ${title} :: ${detail}`);
  return rec.verdict;
}
async function klikTautan(page, href) {
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await page.waitForURL((u) => u.pathname + u.search === href || u.pathname === href, { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
}
async function buka(page, path) {
  await page.goto(`${APP}${path}`, { timeout: SLOW, waitUntil: "networkidle" });
  await closeTour(page);
}
// a person signs in as Gate 3 has it (masuk.mjs): activation the first time, the password after; where it lands
const jalanMasuk = new Map();
async function masukSurel(page, email) {
  const r = await masukStaf(page, email, keadaanDari(sql, lit));
  jalanMasuk.set(email, `${r.jalan}${r.lewat.length ? ` (${r.lewat.join(" → ")})` : ""}`);
  return r.di;
}
async function masukKartu(page, k) {
  await page.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await page.locator("#kartu").fill(k.number);
  await page.locator("#pin").fill(k.pin);
  await page.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk" && u.pathname !== "/masuk/kartu", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
  return new URL(page.url()).pathname;
}
// «Keluar» on the session strip, as a person leaves; where it went
async function keluar(page) {
  const dari = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "Keluar", exact: true }).first().click();
  await page.waitForURL((u) => u.pathname !== dari, { timeout: SLOW });
  // the public front it lands on never goes network-idle (run 37289554356); the sign-out itself is X1's to judge
  await page.waitForLoadState("load");
  return new URL(page.url()).pathname;
}
// read only: the sessions one person opened since `sejak` (epoch seconds), each «MODE:ended reason» or «MODE:OPEN»
const sesiSejak = (auth, sejak) => sql(`select coalesce(string_agg(d.mode || ':' || coalesce(d.ended_reason, 'OPEN'), ',' order by d.created_at), '')
    from public.device_sessions d where d.auth_user_id = '${uuid(auth)}' and d.created_at >= to_timestamp(${Number(sejak)})`);
const authDari = (email) => uuid(sql(`select u.id from auth.users u where lower(u.email) = lower(${lit(email)}) limit 1`));
const kini = () => Number(sql("select floor(extract(epoch from clock_timestamp()))"));
const MULAI = kini();
// a person done with their part goes home and signs out; how it went is X1's to judge, not the step's
const pamitan = new Map();
async function pamit(page, siapa, rumah) {
  try {
    await buka(page, rumah);
    pamitan.set(siapa, `«Keluar» → ${await keluar(page)}`);
  } catch (e) {
    pamitan.set(siapa, `«Keluar» failed: ${String(e.message ?? e).split("\n")[0].slice(0, 120)}`);
  }
  await page.context().close();
}

// Every figure on a page, as a person reads it: its label, its value, its sample line, and any rows (a readiness
// tier and its count, a topic and its share). Covers the evidence cards (.pin-metric) and the report pages (article).
async function angka(scope) {
  return scope.locator(".pin-metric, main article").evaluateAll((els) => els.map((e) => {
    const t = (x) => (x?.textContent ?? "").replace(/\s+/g, " ").trim();
    const baris = [
      ...[...e.querySelectorAll(".pin-rrow")].map((r) => [...r.querySelectorAll("span")].slice(0, 2).map(t)),
      ...[...e.querySelectorAll("dl.pin-lap-isi > div")].map((r) => [t(r.querySelector("dt")), t(r.querySelector("dd"))]),
      ...[...e.querySelectorAll("ul.pin-lap-baris > li")].map((r) => [...r.querySelectorAll("span")].slice(0, 2).map(t)),
    ];
    return { label: t(e.querySelector(".pin-ml, h2")), nilai: t(e.querySelector(".pin-mv, .pin-lap-satu")), teks: t(e), baris };
  }));
}
// one figure, by its label, must read as expected; returns a line for the log, or throws
function harus(figs, label, { nilai, sampel, tingkat, kurang, pita } = {}) {
  const f = figs.find((x) => x.label === label);
  if (!f) throw new Error(`no «${label}» on the page (labels: ${figs.map((x) => x.label).filter(Boolean).join(", ") || "none"})`);
  const salah = [];
  if (nilai !== undefined && f.nilai !== nilai && !f.teks.includes(nilai)) salah.push(`value «${f.nilai || f.teks.slice(0, 60)}», expected «${nilai}»`);
  if (sampel !== undefined && !new RegExp(`Dari ${sampel}\\b`).test(f.teks)) salah.push(`sample not «Dari ${sampel}» («${f.teks.slice(0, 120)}»)`);
  if (tingkat) {
    const ada = Object.fromEntries(f.baris.map(([k, v]) => [k, Number(String(v).replace(/\D/g, ""))]));
    for (const [k, n] of Object.entries(tingkat)) if ((ada[k] ?? 0) !== n) salah.push(`«${k}» ${ada[k] ?? 0}, expected ${n}`);
    for (const [k, n] of Object.entries(ada)) if (!(k in tingkat) && n !== 0) salah.push(`unexpected «${k}» ${n}`);
  }
  if (kurang && !/Belum cukup data|Belum ada bukti/.test(f.teks)) salah.push(`expected withheld below its minimum, got «${f.teks.slice(0, 120)}»`);
  if (pita) {
    // D-095: the bands drawn in band order, with the line that they are PINTAR's fixed bands, not the school's threshold
    const urut = f.baris.map(([k]) => k).filter((k) => Object.values(TIER).includes(k));
    const harap = Object.values(TIER).filter((k) => urut.includes(k));
    if (JSON.stringify(urut) !== JSON.stringify(harap)) salah.push(`bands drawn as ${urut.join(", ")}, not ${harap.join(", ")}`);
    if (!/Pita tetap PINTAR/.test(f.teks) || !/Bukan batas ketuntasan sekolah/.test(f.teks) || !/tidak menentukan sertifikat/.test(f.teks))
      salah.push(`no line saying these are PINTAR's fixed bands, not the school's threshold («${f.teks.slice(0, 160)}»)`);
    if (/Siap sertifikasi|Perlu review|Butuh pendampingan ekstra|Nama diurutkan abjad/i.test(f.teks)) salah.push(`a retired word or the stray sentence: «${f.teks.slice(0, 160)}»`);
  }
  if (salah.length) throw new Error(`«${label}»: ${salah.join("; ")}`);
  return `«${label}» ${kurang ? f.teks.match(/\(\d+\/\d+\)/)?.[0] ?? "withheld" : f.nilai || f.baris.map((b) => b.join(" ")).join(", ")}`;
}
// a refusal is a page that says so and shows no figure
async function ditolak(page, path) {
  await buka(page, path);
  const tolak = await page.locator(".pin-refusal").count();
  const figs = await angka(page);
  const berangka = figs.filter((f) => f.nilai || f.baris.length).length;
  if (!tolak || berangka) throw new Error(`${path}: ${tolak ? "" : "no refusal"}${berangka ? ` ${berangka} figure(s) shown` : ""}`);
  return `${path.split("?")[0].replace(/[0-9a-f-]{36}/g, "<id>")} refused`;
}
// a summary page that the reader may open but whose figures are not theirs to see
async function tanpaAngka(page, path) {
  await buka(page, path);
  const figs = await angka(page);
  const berangka = figs.filter((f) => f.nilai || f.baris.length);
  const teks = norm(await page.locator("main").innerText().catch(() => ""));
  if (berangka.length) throw new Error(`${path}: shows ${berangka.map((f) => `«${f.label}» ${f.nilai}`).join(", ")}`);
  return `${path.split("?")[0]} shows no figure («${teks.match(/Belum ada angka[^.]*\.|Tidak ada angka[^.]*\./)?.[0] ?? teks.slice(0, 80)}»)`;
}

// ── read-only facts and the figures they imply
let S = null;
const ctx = () => browser.newContext({ viewport: { width: 820, height: 1180 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
const browser = await chromium.launch();

await step("L0", `read only: «${SLUG}», «${KELAS}», «${BAB}», and the figures computed from the raw official results`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || k.id || '|' || b.id || '|' || root.id || '|' || la.id || '|' || la.course_id
      || '|' || (select k2.id from public.org_nodes k2 join public.institutions i2 on i2.id = k2.institution_id
                  where i2.name = ${lit(SEKOLAH_LAIN)} and k2.kind = 'CLASS' and k2.is_active order by k2.name limit 1)
      || '|' || (select n2.id from public.org_nodes n2 join public.institutions i2 on i2.id = n2.institution_id
                  where i2.name = ${lit(SEKOLAH_LAIN)} and n2.parent_id is null limit 1)
    from public.institutions i
    join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
    join public.org_nodes b on b.institution_id = i.id and b.kind = 'DEPARTMENT' and b.name = ${lit(BAGIAN)}
    join public.org_nodes root on root.institution_id = i.id and root.parent_id is null
    join public.courses c on c.institution_id = i.id and c.title = ${lit(BAB)}
    join public.learning_assignments la on la.course_id = c.id and la.node_id = k.id
   where i.slug = ${lit(SLUG)} order by la.created_at desc limit 1`);
  if (!r) { rec.verdict = "FAIL"; return `no chapter given to «${KELAS}» in «${SLUG}» (GS-04 to GS-11)`; }
  const [id, nama, kelas, bagian, akar, tugas, kursus, kelasLain, akarLain] = r.split("|");
  // each student's latest official result per test, from the raw tables
  const baris = sql(`select p.id || '|' || p.display_name || '|' || s.mode::text || '|' || s.id || '|' || r.mastery::text || '|' ||
        r.safety_gate_passed::text || '|' || coalesce(s.pass_mark::text, '')
      from public.assessment_sessions s
      join public.learning_assignments la on la.id = s.learning_assignment_id and la.node_id = '${uuid(kelas)}'
      join public.persons p on p.id = s.person_id
      join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
     where s.status = 'FINALIZED' and public.effective_evidence_class(s.id) = 'OFFICIAL'
     order by p.display_name, s.mode`).split("\n").filter(Boolean).map((l) => l.split("|"));
  const murid = new Map();
  for (const [orang, namaM, mode, sesi, m, gerbang, batas] of baris) {
    const x = murid.get(orang) ?? { orang, nama: namaM };
    x[mode === "POST_TEST" ? "post" : "pre"] = { sesi, m: Number(m), gerbang: gerbang === "true", batas: batas ? Number(batas) : null };
    murid.set(orang, x);
  }
  const semua = [...murid.values()];
  const posts = semua.filter((x) => x.post);
  const kedua = semua.filter((x) => x.post && x.pre);
  const tingkat = { [TIER.siap]: 0, [TIER.review]: 0, [TIER.dampingi]: 0 };
  for (const x of posts) tingkat[x.post.m < 0.6 ? TIER.dampingi : x.post.m < 0.8 || !x.post.gerbang ? TIER.review : TIER.siap]++;
  const terbit = Number(sql(`select count(*) from public.academic_certificates c where c.institution_id = '${uuid(id)}' and c.status = 'ISSUED'`));
  S = {
    id, nama, kelas, bagian, akar, tugas, kursus, kelasLain, akarLain, murid: semua, terbit,
    peserta: semua.length,
    paham: posts.reduce((t, x) => t + x.post.m, 0) / posts.length,
    naik: kedua.reduce((t, x) => t + (x.post.m - x.pre.m), 0) / kedua.length,
    nPost: posts.length, nKedua: kedua.length, tingkat,
  };
  if (S.peserta !== MURID.length || posts.length !== MURID.length) { rec.verdict = "FAIL"; return `${S.peserta} learners with official results, ${posts.length} post-tests; the recipe has ${MURID.length}`; }
  return `${nama}: ${S.peserta} learners; expected Pemahaman ${persen(S.paham)} (from ${S.nPost}), Kenaikan ${poin(S.naik)} (from ${S.nKedua}), ` +
    `tiers ${Object.entries(tingkat).map(([k, n]) => `${k} ${n}`).join(", ")}; certificates issued ${terbit}; ` +
    semua.map((x) => `${x.nama.split(" ")[0]} pre ${x.pre ? persen(x.pre.m) : "-"} post ${persen(x.post.m)}${x.post.batas != null ? ` (mark ${persen(x.post.batas)})` : ""}`).join("; ");
});

const KELAS_ANGKA = () => ({
  paham: [`Pemahaman`, { nilai: persen(S.paham), sampel: S.nPost }],
  naik: [`Kenaikan`, { nilai: poin(S.naik), sampel: S.nKedua }],
  siap: [PITA, { tingkat: S.tingkat, pita: true }],
});

// ── GS-17: the teacher
let guru = null;
await step("L1", "GS-17 the teacher: signs in → Mengajar → «Kelas 5A» → «Lihat bukti» and each student's «Hasil resmi»; scope", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  guru = await (await ctx()).newPage();
  const out = [];
  const di = await masukSurel(guru, mail("guru"));
  if (di !== "/mengajar") throw new Error(`landed on ${di}, not /mengajar`);
  const baris = guru.locator(`a.pin-row[href="/mengajar/${S.kelas}"]`);
  await baris.waitFor({ timeout: SLOW });
  out.push(`Mengajar lists «${norm(await baris.innerText()).slice(0, 60)}»`);
  await klikTautan(guru, `/mengajar/${S.kelas}`);
  // the text as written (textContent): innerText returns labels the stylesheet sets in capitals (.pin-facts dt)
  const fakta = norm(await guru.locator("main").textContent());
  const terdaftar = fakta.match(/Murid terdaftar\s*(\d+)/i)?.[1];
  if (Number(terdaftar) !== S.peserta) throw new Error(`«Murid terdaftar» ${terdaftar}, expected ${S.peserta}`);
  await guru.getByRole("link", { name: "Lihat bukti" }).click();
  await guru.waitForURL((u) => u.pathname === `/mengajar/${S.kelas}/bukti`, { timeout: SLOW });
  await guru.waitForLoadState("networkidle");
  await shot(guru, "l1-guru-bukti");
  const isi = norm(await guru.locator("main").textContent());
  const kumpul = [...isi.matchAll(/Mengumpulkan\s*(\d+)\s*\/\s*(\d+)/gi)].map((m) => `${m[1]}/${m[2]}`);
  if (!kumpul.length || kumpul.some((k) => k !== `${S.peserta}/${S.peserta}`)) throw new Error(`«Mengumpulkan» ${kumpul.join(", ") || "absent"}, expected ${S.peserta}/${S.peserta} for each test`);
  out.push(`«Keadaan hari ini» Mengumpulkan ${kumpul.join(", ")}`);
  const figs = await angka(guru.locator("main"));
  for (const [label, harap] of Object.values(KELAS_ANGKA())) out.push(harus(figs, label, harap));
  const topik = figs.find((f) => f.label === "Penguasaan per bagian");
  if (topik) {
    const nilai = topik.baris.map(([, v]) => Number(String(v).replace(/\D/g, "")));
    if (!nilai.length || nilai.some((v) => !(v >= 0 && v <= 100))) throw new Error(`«Penguasaan per bagian» rows ${JSON.stringify(topik.baris)}`);
    out.push(`«Penguasaan per bagian» ${topik.baris.length} rows (read, not recomputed)`);
  } else out.push("«Penguasaan per bagian» not shown");
  // each student's official results, against the sealed mark
  for (const m of S.murid) {
    await buka(guru, `/mengajar/${S.kelas}/murid/${m.orang}`);
    const hasil = await guru.locator('section[aria-labelledby="pin-murid-hasil"] dl.pin-facts > div').evaluateAll((els) => els.map((e) => ({
      dd: (e.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      target: e.querySelector("small[data-target]")?.getAttribute("data-target") ?? null,
      kecil: (e.querySelector("small")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
    const berbatas = hasil.filter((h) => h.target);
    const harapT = m.post.m < m.post.batas ? "belum" : "batas";
    const ok = berbatas.length === 1 && berbatas[0].dd.startsWith(persen(m.post.m)) && berbatas[0].target === harapT &&
      berbatas[0].kecil.includes(persen(m.post.batas));
    // the Pemetaan Awal has no mark: if it is listed, its mastery must be the stored one
    const pra = hasil.filter((h) => !h.target);
    const praOk = pra.every((h) => h.dd.startsWith(persen(m.pre.m)));
    if (!ok || !praOk) { rec.verdict = "FAIL"; await shot(guru, `l1-murid-${m.nama.split(" ")[0]}`); }
    out.push(`${m.nama.split(" ")[0]}: ${berbatas[0]?.dd ?? "no result with a target"}${pra.length ? `, pre ${pra.map((h) => h.dd).join(", ")}` : ""}` +
      `${ok && praOk ? "" : ` MISMATCH (expected post ${persen(m.post.m)} ${harapT}, pre ${persen(m.pre.m)})`}`);
  }
  // scope
  out.push(await ditolak(guru, `/mengajar/${S.kelasLain}`));
  out.push(await ditolak(guru, "/pimpinan"));
  out.push(await tanpaAngka(guru, `/dekan/ringkasan?simpul=${S.akar}`));
  return out.join("; ");
});

// ── GS-17: the head of department
await step("L2", `GS-17 the head of department («${BAGIAN}»): signs in → /pimpinan → «Per kelas» → «${KELAS}»; scope`, async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  const p = await (await ctx()).newPage();
  const out = [];
  const di = await masukSurel(p, mail("kabag"));
  if (di !== "/pimpinan") throw new Error(`landed on ${di}, not /pimpinan`);
  out.push(...await kelasDiPimpinan(p, "l2-kabag"));
  if (await p.getByRole("link", { name: "Buka ringkasan sekolah" }).count()) throw new Error("the head of department is offered the school summary");
  const bukti = await angka(p.locator('section[aria-labelledby="pin-bukti"]'));
  if (bukti.some((f) => f.nilai || f.baris.length)) throw new Error(`school figures shown to the head of department: ${bukti.map((f) => f.label).join(", ")}`);
  out.push("no school figure, no «Buka ringkasan sekolah»");
  out.push(await ditolak(p, `/pimpinan/${S.akar}`));
  out.push(await ditolak(p, `/pimpinan/${S.akarLain}`));
  await pamit(p, "the head of department", "/pimpinan");
  return out.join("; ");
});

// /pimpinan's «Per kelas» panel for the class: the roster count and the class's figures
async function kelasDiPimpinan(p, nama) {
  const out = [];
  const panel = p.locator("details.pin-kelas-bukti").filter({ has: p.locator("summary", { hasText: KELAS }) }).first();
  await panel.waitFor({ timeout: SLOW });
  await panel.locator("summary").click();
  await shot(p, nama);
  const teks = norm(await panel.innerText());
  const n = teks.match(/Murid di kelas ini sekarang · (\d+)/)?.[1];
  if (Number(n) !== S.peserta) throw new Error(`«Murid di kelas ini sekarang» ${n}, expected ${S.peserta}`);
  out.push(`«${KELAS}»: ${n} students now`);
  const figs = await angka(panel);
  out.push(harus(figs, "Peserta", { nilai: ANGKA.format(S.peserta) }));
  out.push(harus(figs, "Pemahaman", { nilai: persen(S.paham) }));
  out.push(harus(figs, "Kenaikan", { nilai: poin(S.naik) }));
  out.push(harus(figs, PITA, { tingkat: S.tingkat, pita: true }));
  return out;
}

// ── GS-17: the dean
await step("L3", "GS-17 the dean: signs in (first time) → /pimpinan: the school's figures, «Kelas 5A», «Buka ringkasan sekolah»; scope", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  const p = await (await ctx()).newPage();
  const out = [];
  const di = await masukSurel(p, mail("dekan"));
  if (di !== "/pimpinan") throw new Error(`landed on ${di}, not /pimpinan`);
  const sekolah = await angka(p.locator('section[aria-labelledby="pin-bukti"]'));
  await shot(p, "l3-dekan-pimpinan");
  out.push(harus(sekolah, "Peserta", { nilai: ANGKA.format(S.peserta) }));
  for (const label of ["Kenaikan", "Butir wajib", "Capaian kompetensi"]) {
    if (sekolah.some((f) => f.label === label)) out.push(harus(sekolah, label, { kurang: true }));
  }
  out.push(...await kelasDiPimpinan(p, "l3-dekan-kelas"));
  await p.getByRole("link", { name: "Buka ringkasan sekolah" }).click();
  await p.waitForURL((u) => u.pathname === "/dekan/ringkasan", { timeout: SLOW });
  await p.waitForLoadState("networkidle");
  await shot(p, "l3-dekan-ringkasan");
  const lap = await angka(p.locator("main"));
  out.push(`summary: ${harus(lap, "Peserta", { nilai: ANGKA.format(S.peserta) })}, ${harus(lap, "Sertifikat terbit", { nilai: ANGKA.format(S.terbit) })}`);
  out.push(await ditolak(p, `/pimpinan/${S.akarLain}`));
  out.push(await tanpaAngka(p, `/dekan/ringkasan?simpul=${S.akarLain}`));
  await pamit(p, "the dean", "/pimpinan");
  return out.join("; ");
});

// ── GS-17: the school admin
await step("L4", "GS-17 the school admin: signs in → Konfigurasi → «Laporan»: the school summary and «Kelas 5A»'s; scope", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  const p = await (await ctx()).newPage();
  const out = [];
  const di = await masukSurel(p, mail("admin"));
  if (di !== "/konfigurasi") throw new Error(`landed on ${di}, not /konfigurasi`);
  await klikTautan(p, `/dekan/ringkasan?simpul=${S.akar}`);
  const lap = await angka(p.locator("main"));
  await shot(p, "l4-admin-sekolah");
  out.push(`school summary: ${harus(lap, "Peserta", { nilai: ANGKA.format(S.peserta) })}, ${harus(lap, "Sertifikat terbit", { nilai: ANGKA.format(S.terbit) })}`);
  await buka(p, "/konfigurasi");
  await klikTautan(p, `/edukator/ringkasan?kelas=${S.kelas}`);
  const kls = await angka(p.locator("main"));
  await shot(p, "l4-admin-kelas");
  out.push(`«${KELAS}» summary: ${[harus(kls, "Peserta", { nilai: ANGKA.format(S.peserta) }),
    ...Object.values(KELAS_ANGKA()).map(([label, h]) => harus(kls, label, { nilai: h.nilai, tingkat: h.tingkat, pita: h.pita }))].join(", ")}`);
  out.push(await ditolak(p, "/pimpinan"));
  out.push(await tanpaAngka(p, `/edukator/ringkasan?kelas=${S.kelasLain}`));
  await pamit(p, "the school admin (L4)", "/konfigurasi");
  return out.join("; ");
});

// ── GS-18: the certificate
let SERT = [];
await step("C1", "GS-18 read only: who is eligible (official, sealed mark, safety gate, mastery ≥ mark) against what was issued", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  SERT = sql(`select c.person_id || '|' || c.session_id || '|' || s.mode::text || '|' || c.status::text || '|' || c.certificate_number || '|' ||
        c.verification_token || '|' || sn.name_as_issued || '|' || (c.signature is not null and c.signature <> '')::text || '|' ||
        (c.revoked_at is null)::text || '|' || c.issued_at_iso
      from public.academic_certificates c join public.assessment_sessions s on s.id = c.session_id
      join public.certificate_identity_snapshots sn on sn.id = c.snapshot_id
     where c.institution_id = '${uuid(S.id)}' order by c.certificate_number`).split("\n").filter(Boolean).map((l) => {
    const [orang, sesi, mode, status, nomor, token, nama, bertanda, berlaku, terbit] = l.split("|");
    return { orang, sesi, mode, status, nomor, token, nama, bertanda: bertanda === "true", berlaku: berlaku === "true", terbit };
  });
  const out = [];
  const nomor = new RegExp(`^PINTAR/${SLUG.toUpperCase()}/\\d{4}/\\d{5}$`);
  for (const m of S.murid) {
    const layak = m.post.batas != null && m.post.gerbang && m.post.m >= m.post.batas;
    const milik = SERT.filter((c) => c.orang === m.orang);
    const ok = layak
      ? milik.length === 1 && milik[0].sesi === m.post.sesi && milik[0].mode === "POST_TEST" && milik[0].status === "ISSUED" &&
        milik[0].bertanda && milik[0].berlaku && milik[0].nama === m.nama && nomor.test(milik[0].nomor)
      : milik.length === 0;
    if (!ok) rec.verdict = "FAIL";
    out.push(`${m.nama.split(" ")[0]} ${persen(m.post.m)} ${layak ? `eligible → ${milik.map((c) => `${c.status} ${c.nomor} on its ${c.mode}`).join(", ") || "none"}` : `not eligible → ${milik.length} issued`}${ok ? "" : " MISMATCH"}`);
  }
  if (SERT.some((c) => c.mode !== "POST_TEST")) { rec.verdict = "FAIL"; out.push("a certificate on a test that does not certify"); }
  if (SERT.length !== S.terbit) { rec.verdict = "FAIL"; out.push(`${SERT.length} certificates, ${S.terbit} ISSUED`); }
  return out.join("; ");
});
// ── GS-21: a lost card and a damaged one, re-issued by the school admin
const kartuBaru = new Map(); // a student's name → the new card's number and PIN, read from its sheet (masked, never logged)
const orangDari = (nama) => S?.murid.find((m) => m.nama === nama)?.orang;
// read only: a learner's account: its card's last four digits, their official results, its open sessions, its Auth user
const akunMurid = (orang) => {
  const [akhir, hasil, terbuka, auth, sesiAuth] = sql(`select right(coalesce(a.card_number, ''), 4) || '|' ||
      (select count(*) from public.assessment_results r join public.assessment_sessions s on s.id = r.session_id where s.person_id = a.person_id) || '|' ||
      (select count(*) from public.device_sessions d where d.auth_user_id = a.auth_user_id and d.ended_at is null) || '|' || a.auth_user_id || '|' ||
      (select count(*) from auth.sessions x where x.user_id = a.auth_user_id)
    from public.accounts a where a.person_id = '${uuid(orang)}' limit 1`).split("|");
  return { akhir, hasil: Number(hasil), terbuka: Number(terbuka), auth, sesiAuth: Number(sesiAuth) };
};
await step("R1", "GS-21 (J2.21) the school admin re-issues the primary student's lost card and Bunga's damaged one on Aktivasi «Kartu hilang atau rusak»; the old card stops, the account and its results stay", async (rec) => {
  if (!S) { rec.verdict = "NOT RUN"; return "L0 did not read the school"; }
  const A = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();
  const out = [];
  const di = await masukSurel(A, mail("admin"));
  if (di !== "/konfigurasi") throw new Error(`the admin landed on ${di}, not /konfigurasi`);
  await klikTautan(A, "/aktivasi");
  const bagian = A.locator('section[aria-labelledby="pin-akt-ulang"]');
  await bagian.waitFor({ timeout: SLOW });
  for (const [nama, alasan, kata] of [[MURID[0], "HILANG", "Kartunya hilang"], [MURID[1], "RUSAK", "Kartunya rusak"]]) {
    const orang = orangDari(nama);
    if (!orang) throw new Error(`${nama} has no official result (L0)`);
    const sebelum = akunMurid(orang);
    const jejak = Number(sql("select coalesce(max(id), 0) from public.audit_log"));
    await bagian.locator('input[type="search"]').fill(nama);
    const baris = bagian.locator("ul.pin-lap-baris > li").filter({ hasText: nama });
    await baris.first().waitFor({ timeout: SLOW });
    if ((await baris.count()) !== 1) throw new Error(`«${nama}» matches ${await baris.count()} rows`);
    const akhiranLama = norm(await baris.innerText()).match(/Kartu berakhiran\s*(\d{4})/i)?.[1] ?? "";
    await baris.getByRole("button", { name: "Terbitkan kartu baru", exact: true }).click();
    await baris.getByRole("radio", { name: kata }).check();
    await shot(A, `r1-${alasan.toLowerCase()}-konfirmasi`);
    await baris.getByRole("button", { name: "Ya, terbitkan kartu baru", exact: true }).click();
    // the new card's sheet (no screenshot: it carries the live PIN)
    const lembar = bagian.locator("li.pin-akt-kartu").filter({ hasText: nama });
    try { await lembar.waitFor({ timeout: SLOW }); } catch { throw new Error(`no new card for ${nama}: ${norm(await baris.innerText()).slice(0, 200)}`); }
    const [number, pin] = await lembar.locator("dd.pin-num").evaluateAll((ds) => ds.map((d) => (d.textContent ?? "").trim()));
    if (!/^\d{10}$/.test(number ?? "") || !/^\d{6}$/.test(pin ?? "")) throw new Error(`the new card's sheet for ${nama} does not read as a 10-digit number and a 6-digit PIN`);
    kartuBaru.set(nama, { number: tutupi(number), pin: tutupi(pin) });
    const sesudah = akunMurid(orang);
    const [sebab, peran, sekolah] = sql(`select coalesce(l.summary->>'reason', '') || '|' || coalesce(l.summary->>'actor_role', '') || '|' || coalesce(l.institution_id::text, '')
        from public.audit_log l where l.id > ${jejak} and l.action = 'account.card_reissued' and l.target_id = ${lit(orang)} order by l.id desc limit 1`).split("|");
    const baru = sesudah.akhir === number.slice(-4) && sesudah.akhir !== sebelum.akhir;
    const ok = akhiranLama === sebelum.akhir && baru && String(sebab).toUpperCase() === alasan && sekolah === S.id &&
      sesudah.hasil === sebelum.hasil && sesudah.terbuka === 0 && sesudah.sesiAuth === 0;
    if (!ok) rec.verdict = "FAIL";
    out.push(`${nama.split(" ")[0]} («${kata}»): the list showed the card's last four digits ${akhiranLama === sebelum.akhir ? "as recorded" : "NOT as recorded"}; ` +
      `the account's card is the new one ${baru}; audit ${sebab || "none"} by ${peran || "?"} at this school ${sekolah === S.id}; ` +
      `official results ${sebelum.hasil} → ${sesudah.hasil}; open sessions ${sebelum.terbuka} → ${sesudah.terbuka}, Auth sessions ${sebelum.sesiAuth} → ${sesudah.sesiAuth}`);
  }
  await pamit(A, "the school admin (R1)", "/konfigurasi");
  return out.join("; ");
});

// ── GS-18 and GS-20 on one class computer: the browser the students share
let kelas = null;
let TAUTAN = null; // the holder's verification link, as her certificate page shows it
let tKelas = MULAI; // when the class computer's first sign-in began (R1's re-issue ends, and may record, older sessions)
await step("C2", "GS-18 (J8.3) the holder signs in with her new card and sees the certificate: «Sertifikat» → the chapter → «Sertifikat Penguasaan», its number, the name as issued, its verification link", async (rec) => {
  const k = kartuBaru.get(MURID[0]);
  const c = SERT.find((x) => x.orang === orangDari(MURID[0]));
  if (!k || !c) { rec.verdict = "NOT RUN"; return !k ? "R1 gave the primary student no new card" : "the primary student has no certificate (C1)"; }
  tKelas = kini();
  kelas = await (await ctx()).newPage();
  const di = await masukKartu(kelas, k);
  if (di !== "/belajar") throw new Error(`the new card landed on ${di}, not /belajar`);
  const menu = kelas.locator('a[href="/belajar/sertifikat"]').first();
  const lewatMenu = await menu.isVisible().catch(() => false);
  if (lewatMenu) await klikTautan(kelas, "/belajar/sertifikat"); else await buka(kelas, "/belajar/sertifikat");
  const tautanBab = kelas.locator(`a[href="/belajar/${S.tugas}/sertifikat"]`).first();
  await tautanBab.waitFor({ timeout: SLOW });
  await tautanBab.click();
  await kelas.waitForURL((u) => u.pathname === `/belajar/${S.tugas}/sertifikat`, { timeout: SLOW });
  await kelas.getByText(/Cetak atau simpan PDF/).first().waitFor({ timeout: SLOW });
  await shot(kelas, "c2-sertifikat-pemegang");
  const teks = norm(await kelas.locator("body").innerText());
  TAUTAN = norm(await kelas.locator("code.pin-chip").first().innerText().catch(() => ""));
  const harap = `/verifikasi/${encodeURIComponent(c.token)}`;
  const salah = [];
  if (!/Sertifikat Penguasaan/i.test(teks)) salah.push("no «Sertifikat Penguasaan»");
  if (!teks.includes(c.nomor)) salah.push(`not its number ${c.nomor}`);
  if (!teks.includes(c.nama)) salah.push("not the name as issued");
  if (!TAUTAN.startsWith("https://") || !TAUTAN.endsWith(harap)) salah.push("a verification link that is not the record's");
  if (salah.length) throw new Error(salah.join("; "));
  return `the new card → /belajar → «Sertifikat» (${lewatMenu ? "its menu link" : "by address"}) → the chapter: «Sertifikat Penguasaan» ${c.nomor}, ` +
    "the name as issued, «Cetak atau simpan PDF», and its verification link, the record's";
});

await step("U1", "GS-20 (J2.9, J2.20) the class computer: her lesson locks after 5 idle minutes and her card's PIN resumes it at the same page; idle again, «Bukan akun Anda?» → «Keluar»; Bunga signs in on the same browser to her own session and the lesson at its first page; she signs out", async (rec) => {
  const ku = kartuBaru.get(MURID[0]), kb = kartuBaru.get(MURID[1]);
  if (!kelas || !ku || !kb) { rec.verdict = "NOT RUN"; return !kelas ? "C2 did not sign the holder in" : "R1 gave the two students no new cards"; }
  const p = kelas, out = [];
  const authU = akunMurid(orangDari(MURID[0])).auth, authB = akunMurid(orangDari(MURID[1])).auth;
  const posisi = async () => {
    const m = norm(await p.locator("p.pin-lpos").first().innerText().catch(() => "")).match(/(\d+)\s*\/\s*(\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
  };
  // the chapter's page → its first lesson in the list («Buka pelajarannya» on the reading map is there only while a
  // lesson is unread, and the holder has read them all)
  const bukaPelajaran = async () => {
    await buka(p, `/belajar/${S.tugas}`);
    await p.locator(`a.pin-row[href^="/belajar/${S.tugas}/pelajaran/"]`).first().click();
    await p.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
    await p.locator("p.pin-lpos").first().waitFor({ timeout: SLOW });
    await p.waitForLoadState("networkidle");
    return new URL(p.url()).pathname;
  };
  const pelajaran = await bukaPelajaran();
  let [hal, dari] = await posisi();
  if (hal === 1 && dari > 1) {
    await p.getByRole("button", { name: "Halaman berikutnya", exact: true }).click();
    await p.waitForFunction(() => /\b2\s*\//.test(document.querySelector("p.pin-lpos")?.textContent ?? ""), null, { timeout: SLOW });
    [hal, dari] = await posisi();
  }
  await p.waitForTimeout(1500); // the page reached is saved on view
  // 5 minutes without a key, a click or a move: the screen itself goes to «PINTAR terkunci»
  const t0 = Date.now();
  const tanda = await p.getByRole("button", { name: "Saya masih di sini" }).waitFor({ timeout: 5 * 60_000 })
    .then(() => Math.round((Date.now() - t0) / 1000), () => null);
  await p.waitForURL((u) => u.pathname === "/terkunci", { timeout: 7 * 60_000 });
  const dikunci = Math.round((Date.now() - t0) / 1000);
  await p.locator("#pin").waitFor({ timeout: SLOW });
  await shot(p, "u1-terkunci");
  const layar = norm(await p.locator("body").innerText());
  const bernama = MURID.filter((n) => layar.includes(n));
  const tanya = /Komputer siapa ini/.test(layar);
  const kunciDb = sql(`select count(*) from public.device_sessions d where d.auth_user_id = '${uuid(authU)}' and d.ended_at is null and d.locked_at is not null`);
  if (bernama.length || tanya || kunciDb !== "1") rec.verdict = "FAIL";
  out.push(`her lesson at page ${hal}/${dari}; ${tanda != null ? `«Saya masih di sini» at ${tanda}s, ` : "no «Saya masih di sini» seen, "}` +
    `«PINTAR terkunci» at ${dikunci}s (${bernama.length ? `names ${bernama.join(", ")}` : "no name"}, ${tanya ? "asks about the computer" : "no question about the computer"}; ` +
    `${kunciDb} locked session recorded)`);
  await p.locator("#pin").fill(ku.pin);
  await p.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await p.waitForURL((u) => u.pathname !== "/terkunci", { timeout: SLOW });
  await p.locator("p.pin-lpos").first().waitFor({ timeout: SLOW }).catch(() => {});
  const kembali = new URL(p.url()).pathname;
  const [hal2] = await posisi();
  if (kembali !== pelajaran || hal2 !== hal) rec.verdict = "FAIL";
  out.push(`the card's PIN → ${kembali === pelajaran ? "her lesson" : kembali.replace(/[0-9a-f-]{36}/g, "<id>")} at page ${hal2}/${dari}`);
  // idle again; the next learner's «Bukan akun Anda?» → «Keluar»
  const t1 = Date.now();
  await p.waitForURL((u) => u.pathname === "/terkunci", { timeout: 7 * 60_000 });
  const dikunci2 = Math.round((Date.now() - t1) / 1000);
  const bukan = p.getByRole("button", { name: "Keluar", exact: true });
  await bukan.waitFor({ timeout: SLOW });
  await shot(p, "u1-bukan-akun-anda");
  await bukan.click();
  await p.waitForURL((u) => u.pathname !== "/terkunci", { timeout: SLOW });
  await p.waitForLoadState("load");
  await p.goto(`${APP}${pelajaran}`, { timeout: SLOW, waitUntil: "networkidle" });
  const tanpa = new URL(p.url()).pathname;
  const sesiU = sesiSejak(authU, tKelas);
  if (tanpa !== "/masuk" || sesiU !== "CARD:KELUAR") rec.verdict = "FAIL";
  out.push(`locked again at ${dikunci2}s; «Bukan akun Anda?» → «Keluar»: her lesson's address → ${tanpa}; her session ${sesiU || "not recorded"}`);
  // Bunga, on the same browser
  const diB = await masukKartu(p, kb);
  const pelajaranB = await bukaPelajaran();
  const [halB] = await posisi();
  await shot(p, "u1-bunga-pelajaran");
  if (diB !== "/belajar" || pelajaranB !== pelajaran || (dari > 1 && halB !== 1)) rec.verdict = "FAIL";
  const pergi = await keluar(p);
  const sesiB = sesiSejak(authB, tKelas);
  if (sesiB !== "CARD:KELUAR") rec.verdict = "FAIL";
  out.push(`Bunga's new card on the same browser → ${diB}; the same lesson opens at page ${halB}/${dari}; she signs out → ${pergi}; her session ${sesiB || "not recorded"}`);
  await p.context().close();
  kelas = null;
  if (rec.verdict === "PASS" && dari < 2) { rec.verdict = "NOTE"; out.push("the lesson has one page: whose position it opens at cannot be told apart"); }
  return out.join("; ");
});
if (kelas) await kelas.context().close();

await step("C3", "GS-18 staff never open a certificate: the teacher's browser at the holder's certificate page shows none", async (rec) => {
  if (!guru || !SERT.length) { rec.verdict = "NOT RUN"; return "no teacher session or no certificate"; }
  await buka(guru, `/belajar/${S.tugas}/sertifikat`);
  const teks = norm(await guru.locator("body").innerText());
  const bocor = SERT.filter((c) => teks.includes(c.nomor) || teks.includes(c.token));
  if (bocor.length || /Nomor sertifikat/.test(teks)) throw new Error(`the teacher sees ${bocor.map((c) => c.nomor).join(", ") || "a certificate"}`);
  return `the teacher at /belajar/<chapter>/sertifikat: no certificate (landed ${new URL(guru.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>")})`;
});

// ── GS-21: the teacher recovers by email, then by PINTAR ID + PIN
let pulih = null;   // R2's browser, signed in by the recovery
let pintarId = null;
await step("R2", "GS-21 (J2.11) the teacher, on another browser: «Lupa password?» → the emailed code → a new password; the browser of L1 is signed out (D-101(3)); «Akun saya» shows their PINTAR ID", async (rec) => {
  if (!guru) { rec.verdict = "NOT RUN"; return "L1 did not sign the teacher in"; }
  const email = mail("guru"), auth = authDari(email);
  const t = kini();
  pulih = await (await ctx()).newPage();
  await pulihkanDenganEmail(pulih, email, kredensial(email, 1).password);
  const lewat = await selesaikan(pulih, kredensial(email));
  const di = new URL(pulih.url()).pathname;
  await buka(guru, "/mengajar");
  const lama = new URL(guru.url()).pathname;
  const berakhir = sql(`select coalesce(string_agg(d.ended_reason, ',' order by d.ended_at), '') from public.device_sessions d
     where d.auth_user_id = '${auth}' and d.ended_at >= to_timestamp(${t})`);
  await klikTautan(pulih, "/akun");
  await pulih.locator(".pin-idn-id").first().waitFor({ timeout: SLOW });
  pintarId = norm(await pulih.locator(".pin-idn-id").first().innerText()).replace(/\s+/g, "");
  const tercatat = sql(`select p.pintar_id from public.persons p join public.accounts a on a.person_id = p.id where a.auth_user_id = '${auth}'`);
  if (di !== "/mengajar" || lama !== "/masuk" || !berakhir.split(",").includes("KREDENSIAL_DIGANTI") || pintarId !== tercatat) rec.verdict = "FAIL";
  await guru.context().close();
  guru = null;
  return `«Lupa password?» → the emailed code → a new password → «Lanjut» → ${di}${lewat.length ? ` (${lewat.join(" → ")})` : ""}; ` +
    `the L1 browser now → ${lama}; sessions ended by it: ${berakhir || "none"}; «Akun saya» shows the PINTAR ID, the record's: ${pintarId === tercatat}`;
});
await step("R3", "GS-21 (J2.12) on a third browser: «Lupa password?» → «Pakai PINTAR ID dan PIN» with the ID from «Akun saya» and the PIN set at activation → a new password; R2's browser is signed out; the teacher signs out", async (rec) => {
  if (!pulih || !pintarId) { rec.verdict = "NOT RUN"; return "R2 did not recover the teacher or read the PINTAR ID"; }
  const email = mail("guru"), auth = authDari(email), k = kredensial(email);
  const t = kini();
  const p = await (await ctx()).newPage();
  await pulihkanDenganPin(p, pintarId, k.pin, kredensial(email, 2).password);
  const lewat = await selesaikan(p, k);
  const di = new URL(p.url()).pathname;
  await buka(pulih, "/mengajar");
  const lama = new URL(pulih.url()).pathname;
  const berakhir = sql(`select coalesce(string_agg(d.ended_reason, ',' order by d.ended_at), '') from public.device_sessions d
     where d.auth_user_id = '${auth}' and d.ended_at >= to_timestamp(${t})`);
  if (di !== "/mengajar" || lama !== "/masuk" || !berakhir.split(",").includes("KREDENSIAL_DIGANTI")) rec.verdict = "FAIL";
  await pulih.context().close();
  pulih = null;
  await pamit(p, "the teacher", "/mengajar");
  return `«Pakai PINTAR ID dan PIN» → a new password → «Lanjut» → ${di}${lewat.length ? ` (${lewat.join(" → ")})` : ""}; ` +
    `R2's browser now → ${lama}; sessions ended by it: ${berakhir || "none"}; the teacher ${pamitan.get("the teacher")}`;
});
for (const x of [guru, pulih]) if (x) await x.context().close().catch(() => {});

// ── GS-19: the public check
await step("V1", "GS-19 an anonymous visitor opens each issued certificate's verification link", async (rec) => {
  if (!SERT.length) { rec.verdict = "NOT RUN"; return "no certificate"; }
  const c = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const out = [];
  const pemegang = orangDari(MURID[0]);
  for (const s of SERT) {
    const p = await c.newPage();
    // the holder's link as her certificate page showed it (C2); the others as that page builds it, from the record
    const dariHalaman = s.orang === pemegang && TAUTAN ? new URL(TAUTAN).pathname : null;
    const path = dariHalaman ?? `/verifikasi/${encodeURIComponent(s.token)}`;
    const resp = await p.goto(`${APP}${path}`, { timeout: SLOW, waitUntil: "networkidle" });
    const di = new URL(p.url()).pathname;
    // as written (textContent): the facts' labels are set in capitals by the stylesheet
    const teks = norm(await p.locator("main").textContent());
    const pemilik = MURID.find((n) => teks.includes(n));
    const ok = di === path && /Verifikasi Sertifikat/i.test(teks) && /Berlaku/.test(teks) && /Sertifikat ini benar diterbitkan dan masih berlaku\./.test(teks) &&
      /Memenuhi capaian/.test(teks) && teks.includes(S.nama) && /Tanggal terbit/i.test(teks) && /Diterbitkan oleh/i.test(teks) && !pemilik;
    if (!ok) { rec.verdict = "FAIL"; await shot(p, `v1-${s.nomor.slice(-5)}`); }
    const tanggal = teks.match(/Tanggal terbit\s*([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i)?.[1];
    out.push(`${s.nomor}${dariHalaman ? " (the link on the holder's page)" : ""}: HTTP ${resp?.status()} ${ok ? `«Berlaku», «Memenuhi capaian», «${S.nama}», ${tanggal ?? "dated"}` : `MISMATCH (at ${di}; ${teks.slice(0, 400)})`}${pemilik ? `; shows the holder's name ${pemilik}` : ""}`);
    if (s === SERT[0]) await shot(p, "v1-berlaku");
    await p.close();
  }
  await c.close();
  return out.join("; ");
});
await step("V2", "GS-19 a random and a malformed code: the private not-found, nothing revealed; the endpoint says 404", async (rec) => {
  const c = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const p = await c.newPage();
  const out = [];
  for (const kode of [randomBytes(32).toString("base64url"), "abc123"]) {
    const path = `/verifikasi/${kode}`;
    const resp = await p.goto(`${APP}${path}`, { timeout: SLOW, waitUntil: "networkidle" });
    const teks = norm(await p.locator("main").innerText());
    const api = await c.request.get(`${APP}/api/verifikasi/${kode}`);
    const body = await api.text();
    const ok = /Sertifikat dengan tautan ini tidak ditemukan\./.test(teks) && /Periksa kembali tautan atau kode yang Anda terima\./.test(teks) &&
      !teks.includes(S?.nama ?? "\u0000") && !/Berlaku|Memenuhi capaian|Diterbitkan oleh/.test(teks) && api.status() === 404 && body.replace(/\s/g, "") === '{"found":false}';
    if (!ok) { rec.verdict = "FAIL"; await shot(p, `v2-${kode.length}`); }
    out.push(`${kode.length}-char code: page HTTP ${resp?.status()} ${ok ? "«tidak ditemukan», nothing else" : `MISMATCH (${teks.slice(0, 120)})`}; API ${api.status()} ${body.slice(0, 40)}`);
  }
  if (rec.verdict === "PASS") await shot(p, "v2-tidak-ditemukan");
  await c.close();
  return out.join("; ");
});

// ── GS-20: everyone signs out
await step("X1", "GS-20 everyone signs out, read only: every session this run opened is ended («Keluar», or the credential's replacement), none left open", async (rec) => {
  const orang = [["the teacher", "guru"], ["the head of department", "kabag"], ["the dean", "dekan"], ["the school admin", "admin"]]
    .map(([siapa, who]) => [siapa, authDari(mail(who))]);
  for (const nama of MURID.slice(0, 2)) { const o = orangDari(nama); if (o) orang.push([nama.split(" ")[0], akunMurid(o).auth]); }
  const out = [];
  // a record still open whose Auth session is gone (Auth ended it, as it ends the activation wizard's own session
  // when the password is first set, and PINTAR signs the person straight back in) is reported as such, not as open
  for (const [siapa, auth] of orang) {
    const s = sql(`select coalesce(string_agg(d.mode || ':' || coalesce(d.ended_reason, case when exists (select 1 from auth.sessions x
        where x.id = d.session_id) then 'OPEN' else 'RECORD_OPEN_AUTH_GONE' end), ',' order by d.created_at), '')
      from public.device_sessions d where d.auth_user_id = '${uuid(auth)}' and d.created_at >= to_timestamp(${MULAI})`);
    const sesiAuth = Number(sql(`select count(*) from auth.sessions x where x.user_id = '${uuid(auth)}' and x.created_at >= to_timestamp(${MULAI})`));
    if (!s || /:OPEN(,|$)/.test(s) || sesiAuth) rec.verdict = "FAIL";
    out.push(`${siapa}: ${s || "no session this run"}${sesiAuth ? `, ${sesiAuth} Auth session(s) still open` : ""}`);
  }
  out.push(...[...pamitan].map(([siapa, r]) => `${siapa} ${r}`));
  return out.join("; ");
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }

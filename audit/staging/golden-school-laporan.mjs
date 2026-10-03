// STAGING ONLY. The Golden School after its students (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5): what the staff
// read, the certificate, and its public check. After golden-school-murid.mjs (GS-12 to GS-16) has put five official
// results into «Kelas 5A».
//
//   L0  read only: the school GS_SLUG, «Kelas 5A», its chapter, and what the figures must say, computed here from the
//       raw official results (assessment_results), not from PINTAR's calculators: participants, comprehension (the
//       mean post-test mastery), net gain (post − pre, per learner with both), the readiness tiers, each student's
//       mastery against the sealed mark, and the certificates the school has issued.
//   L1  GS-17, the teacher (J7.1, J7.2): signs in by the real email link → Mengajar → «Kelas 5A» → «Lihat bukti»: the
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
//   C2  GS-18 (J8.3): the holder sees the certificate. NOT RUN on this school: a class card's PIN is shown once, the
//       cards were made and used in one run (golden-school-murid.mjs), and main has no card re-issue (GS-21, held
//       with Gate 3). The student cannot sign in again without it; a server-made session is never journey evidence.
//   C3  GS-18: staff never open a certificate; the teacher's browser at the holder's certificate page shows none.
//   V1  GS-19 (J8.6): an anonymous visitor (a fresh browser, no sign-in) opens each issued certificate's verification
//       link, as the certificate page builds it (<app>/verifikasi/<token>): «Berlaku», the result, the school, the
//       date; never the holder's name. The token is read from the database because C2 cannot be walked here.
//   V2  GS-19: a random and a malformed code give the private not-found and reveal nothing; the endpoint says 404.
//
// NEVER: production; a direct write (the database is read in read-only transactions); a server-made session as a
// person's act. The walk changes nothing in PINTAR: it signs four staff in and reads.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";

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
async function masukSurel(page, email) {
  const t0 = Date.now() / 1000 - 60;
  await page.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await page.getByRole("heading", { name: "Periksa email Anda" }).waitFor({ timeout: SLOW });
  const link = execFileSync("python3", ["mailbox_link.py", email, String(t0), "180"], { encoding: "utf8" }).trim();
  console.log(`::add-mask::${link}`);
  await page.goto(link, { timeout: SLOW, waitUntil: "networkidle" });
  await page.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await closeTour(page);
  return new URL(page.url()).pathname;
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
  await p.context().close();
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
  await p.context().close();
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
  await p.context().close();
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
await step("C2", "GS-18 the holder sees the certificate («Sertifikat» → «Sertifikat Penguasaan», its number and verification link)", async (rec) => {
  rec.verdict = "NOT RUN";
  return "the primary student cannot sign in again on this school: a card's PIN is shown once, the cards were made and used in one run, " +
    "and main has no card re-issue (GS-21, held with Gate 3); a server-made session is never journey evidence. To walk on the next Golden School " +
    "instance inside its students' one run (after «Kumpulkan»: «Lihat sertifikat»), and again when Gate 3 lands (D-088(f))";
});
await step("C3", "GS-18 staff never open a certificate: the teacher's browser at the holder's certificate page shows none", async (rec) => {
  if (!guru || !SERT.length) { rec.verdict = "NOT RUN"; return "no teacher session or no certificate"; }
  await buka(guru, `/belajar/${S.tugas}/sertifikat`);
  const teks = norm(await guru.locator("body").innerText());
  const bocor = SERT.filter((c) => teks.includes(c.nomor) || teks.includes(c.token));
  if (bocor.length || /Nomor sertifikat/.test(teks)) throw new Error(`the teacher sees ${bocor.map((c) => c.nomor).join(", ") || "a certificate"}`);
  return `the teacher at /belajar/<chapter>/sertifikat: no certificate (landed ${new URL(guru.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>")})`;
});
if (guru) await guru.context().close();

// ── GS-19: the public check
await step("V1", "GS-19 an anonymous visitor opens each issued certificate's verification link", async (rec) => {
  if (!SERT.length) { rec.verdict = "NOT RUN"; return "no certificate"; }
  const c = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
  const out = [];
  for (const s of SERT) {
    const p = await c.newPage();
    const path = `/verifikasi/${encodeURIComponent(s.token)}`;
    const resp = await p.goto(`${APP}${path}`, { timeout: SLOW, waitUntil: "networkidle" });
    const di = new URL(p.url()).pathname;
    // as written (textContent): the facts' labels are set in capitals by the stylesheet
    const teks = norm(await p.locator("main").textContent());
    const pemilik = MURID.find((n) => teks.includes(n));
    const ok = di === path && /Verifikasi Sertifikat/i.test(teks) && /Berlaku/.test(teks) && /Sertifikat ini benar diterbitkan dan masih berlaku\./.test(teks) &&
      /Memenuhi capaian/.test(teks) && teks.includes(S.nama) && /Tanggal terbit/i.test(teks) && /Diterbitkan oleh/i.test(teks) && !pemilik;
    if (!ok) { rec.verdict = "FAIL"; await shot(p, `v1-${s.nomor.slice(-5)}`); }
    const tanggal = teks.match(/Tanggal terbit\s*([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i)?.[1];
    out.push(`${s.nomor}: HTTP ${resp?.status()} ${ok ? `«Berlaku», «Memenuhi capaian», «${S.nama}», ${tanggal ?? "dated"}` : `MISMATCH (at ${di}; ${teks.slice(0, 400)})`}${pemilik ? `; shows the holder's name ${pemilik}` : ""}`);
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

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
